-- =============================================================================
-- NANO BYTE store — database schema
-- Postgres on Supabase. Every table has Row Level Security (RLS):
--   * customers (anon)  : read visible products/categories/banners/settings,
--                         create an order only through create_order()
--   * staff             : manage products, images, banners, orders
--   * admin             : everything + categories, settings, staff
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.staff_role as enum ('admin', 'staff');
create type public.product_kind as enum ('laptop', 'accessory', 'part', 'charger', 'storage');
create type public.product_condition as enum ('new', 'used', 'refurb');
create type public.order_status as enum ('pending', 'confirmed', 'delivered', 'cancelled');

-- ---------------------------------------------------------------------------
-- Staff & invitations
-- ---------------------------------------------------------------------------
create table public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text,
  role       public.staff_role not null default 'staff',
  created_at timestamptz not null default now()
);

-- Only invited emails can create an account (see gate_signup below).
create table public.staff_invites (
  email      text primary key check (email = lower(email) and email like '%_@_%'),
  role       public.staff_role not null default 'staff',
  name       text,
  created_at timestamptz not null default now(),
  used_at    timestamptz
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role::text from public.staff where user_id = auth.uid();
$$;

-- Block sign-ups from emails that were not invited.
create or replace function public.gate_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null
     or not exists (select 1 from public.staff_invites i
                    where i.email = lower(new.email) and i.used_at is null) then
    raise exception 'signup_not_allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger gate_signup
  before insert on auth.users
  for each row execute function public.gate_signup();

-- Turn the invitation into a staff member once the account exists.
create or replace function public.handle_new_staff() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.staff (user_id, email, name, role)
  select new.id, lower(new.email), i.name, i.role
  from public.staff_invites i
  where i.email = lower(new.email) and i.used_at is null
  on conflict (user_id) do nothing;

  update public.staff_invites set used_at = now()
  where email = lower(new.email) and used_at is null;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_staff();

-- A signed-in user whose email was invited later (e.g. removed then re-added)
-- calls this to become staff again.
create or replace function public.claim_invite() returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
begin
  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is null then
    return null;
  end if;
  insert into public.staff (user_id, email, name, role)
  select auth.uid(), v_email, i.name, i.role
  from public.staff_invites i
  where i.email = v_email and i.used_at is null
  on conflict (user_id) do nothing;
  update public.staff_invites set used_at = now()
  where email = v_email and used_at is null;
  return (select role::text from public.staff where user_id = auth.uid());
end;
$$;

-- The owner's account
insert into public.staff_invites (email, role, name) values ('dafcotech@gmail.com', 'admin', 'أحمد');

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name       text not null check (char_length(name) between 1 and 60),
  icon       text not null default 'box' check (char_length(icon) <= 30),
  sort       int  not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence public.product_sku_seq start 1;

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  sku              text not null unique
                   default ('NB-' || lpad(nextval('public.product_sku_seq')::text, 4, '0')),
  kind             public.product_kind not null default 'laptop',
  category_id      uuid references public.categories (id) on delete set null,
  brand            text check (char_length(brand) <= 40),
  name             text not null check (char_length(name) between 2 and 160),
  -- laptop specs
  cpu              text check (char_length(cpu) <= 60),
  cpu_family       text check (char_length(cpu_family) <= 30),
  cpu_gen          text check (char_length(cpu_gen) <= 20),
  ram_gb           int  check (ram_gb between 1 and 512),
  storage_type     text check (storage_type in ('SSD', 'HDD')),
  storage_gb       int  check (storage_gb between 1 and 100000),
  gpu              text check (char_length(gpu) <= 60),
  screen           text check (char_length(screen) <= 60),
  battery          text check (char_length(battery) <= 40),
  -- shared
  condition        public.product_condition,
  warranty         text check (char_length(warranty) <= 60),
  attrs            jsonb not null default '{}'::jsonb check (jsonb_typeof(attrs) = 'object'),
  price            bigint check (price >= 0),
  old_price        bigint check (old_price >= 0),
  price_on_request boolean not null default false,
  quantity         int not null default 1 check (quantity between 0 and 100000),
  is_visible       boolean not null default true,
  is_offer         boolean not null default false,
  description      text check (char_length(description) <= 4000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  price_updated_at timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null default auth.uid()
);

create index products_category_idx on public.products (category_id);
create index products_created_idx on public.products (created_at desc);

create or replace function public.products_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.price is distinct from old.price or new.old_price is distinct from old.old_price
     or new.price_on_request is distinct from old.price_on_request then
    new.price_updated_at := now();
  end if;
  -- the product code never changes once given
  new.sku := old.sku;
  return new;
end;
$$;

create trigger products_touch
  before update on public.products
  for each row execute function public.products_touch();

create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path       text not null check (char_length(path) <= 200),
  thumb      text not null check (char_length(thumb) <= 200),
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, sort);

create table public.banners (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(title) between 1 and 80),
  subtitle   text check (char_length(subtitle) <= 60),
  image      text check (char_length(image) <= 200),
  link       text check (char_length(link) <= 300),
  sort       int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.settings (
  id             int primary key default 1 check (id = 1),
  store_name     text not null default 'نانو بايت تكنولوجي',
  whatsapp       text not null default '249126111169' check (whatsapp ~ '^[0-9]{8,15}$'),
  phone_primary  text not null default '0126111169',
  phone_secondary text,
  address        text not null default '',
  map_url        text,
  hours          text not null default '',
  delivery_note  text not null default '',
  facebook_url   text,
  tiktok_url     text,
  price_note     text,
  services_text  text not null default '',
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders (created by customers only through create_order)
-- ---------------------------------------------------------------------------
create sequence public.order_no_seq start 1001;

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_no      bigint not null unique default nextval('public.order_no_seq'),
  items         jsonb not null check (jsonb_typeof(items) = 'array'),
  total         bigint not null default 0,
  has_unpriced  boolean not null default false,
  customer_name text check (char_length(customer_name) <= 80),
  delivery      text not null default 'pickup' check (delivery in ('pickup', 'delivery')),
  city          text check (char_length(city) <= 80),
  address       text check (char_length(address) <= 200),
  note          text check (char_length(note) <= 500),
  status        public.order_status not null default 'pending',
  staff_note    text check (char_length(staff_note) <= 500),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create or replace function public.orders_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  -- staff may change only the status and their note
  new.items := old.items;
  new.total := old.total;
  new.order_no := old.order_no;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger orders_touch
  before update on public.orders
  for each row execute function public.orders_touch();

-- Prices and names are read from the database, never trusted from the browser.
create or replace function public.create_order(
  p_items jsonb,
  p_customer_name text default null,
  p_delivery text default 'pickup',
  p_city text default null,
  p_address text default null,
  p_note text default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_lines jsonb := '[]'::jsonb;
  v_total bigint := 0;
  v_unpriced boolean := false;
  v_item jsonb;
  v_qty int;
  v_p public.products;
  v_no bigint;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'invalid_items';
  end if;

  -- basic flood protection
  if (select count(*) from public.orders where created_at > now() - interval '1 minute') >= 15 then
    raise exception 'too_many_orders';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(50, coalesce((v_item ->> 'qty')::int, 1)));
    select * into v_p from public.products
      where id = (v_item ->> 'id')::uuid and is_visible;
    if not found then
      continue;
    end if;
    v_lines := v_lines || jsonb_build_object(
      'id', v_p.id, 'sku', v_p.sku, 'name', v_p.name, 'qty', v_qty,
      'price', case when v_p.price_on_request then null else v_p.price end
    );
    if v_p.price_on_request or v_p.price is null then
      v_unpriced := true;
    else
      v_total := v_total + v_p.price * v_qty;
    end if;
  end loop;

  if jsonb_array_length(v_lines) = 0 then
    raise exception 'no_available_items';
  end if;

  insert into public.orders (items, total, has_unpriced, customer_name, delivery, city, address, note)
  values (
    v_lines, v_total, v_unpriced,
    nullif(left(trim(p_customer_name), 80), ''),
    case when p_delivery = 'delivery' then 'delivery' else 'pickup' end,
    nullif(left(trim(p_city), 80), ''),
    nullif(left(trim(p_address), 200), ''),
    nullif(left(trim(p_note), 500), '')
  )
  returning order_no into v_no;

  return v_no;
end;
$$;

-- Bulk price change (admin): e.g. +10% for all products or one category.
create or replace function public.adjust_prices(
  p_percent numeric,
  p_category uuid default null,
  p_round_to int default 500
) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_count int;
  v_round int := greatest(1, coalesce(p_round_to, 1));
begin
  if not public.is_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_percent is null or p_percent < -90 or p_percent > 500 then
    raise exception 'invalid_percent';
  end if;

  update public.products set
    price = case when price is null then null
                 else (round(price * (1 + p_percent / 100.0) / v_round) * v_round)::bigint end,
    old_price = case when old_price is null then null
                 else (round(old_price * (1 + p_percent / 100.0) / v_round) * v_round)::bigint end
  where (p_category is null or category_id = p_category)
    and price is not null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.staff          enable row level security;
alter table public.staff_invites  enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.banners        enable row level security;
alter table public.settings       enable row level security;
alter table public.orders         enable row level security;

-- staff
create policy "staff: read own row or admin reads all" on public.staff
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "staff: admin updates others" on public.staff
  for update to authenticated using (public.is_admin() and user_id <> auth.uid())
  with check (public.is_admin() and user_id <> auth.uid());
create policy "staff: admin removes others" on public.staff
  for delete to authenticated using (public.is_admin() and user_id <> auth.uid());

-- invites
create policy "invites: admin only" on public.staff_invites
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- categories
create policy "categories: public read visible" on public.categories
  for select using (is_visible or public.is_staff());
create policy "categories: admin insert" on public.categories
  for insert to authenticated with check (public.is_admin());
create policy "categories: admin update" on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "categories: admin delete" on public.categories
  for delete to authenticated using (public.is_admin());

-- products
create policy "products: public read visible" on public.products
  for select using (is_visible or public.is_staff());
create policy "products: staff insert" on public.products
  for insert to authenticated with check (public.is_staff());
create policy "products: staff update" on public.products
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "products: admin delete" on public.products
  for delete to authenticated using (public.is_admin());

-- product images
create policy "images: public read" on public.product_images
  for select using (
    public.is_staff()
    or exists (select 1 from public.products p where p.id = product_id and p.is_visible)
  );
create policy "images: staff insert" on public.product_images
  for insert to authenticated with check (public.is_staff());
create policy "images: staff update" on public.product_images
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "images: staff delete" on public.product_images
  for delete to authenticated using (public.is_staff());

-- banners
create policy "banners: public read active" on public.banners
  for select using (is_active or public.is_staff());
create policy "banners: staff insert" on public.banners
  for insert to authenticated with check (public.is_staff());
create policy "banners: staff update" on public.banners
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "banners: staff delete" on public.banners
  for delete to authenticated using (public.is_staff());

-- settings
create policy "settings: public read" on public.settings for select using (true);
create policy "settings: admin update" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- orders: no public read; customers insert only via create_order()
create policy "orders: staff read" on public.orders
  for select to authenticated using (public.is_staff());
create policy "orders: staff update" on public.orders
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "orders: admin delete" on public.orders
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Table privileges (explicit, least privilege; RLS above still applies)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.banners, public.settings to anon;
grant select, insert, update, delete on
  public.categories, public.products, public.product_images, public.banners,
  public.orders, public.staff, public.staff_invites to authenticated;
grant select, update on public.settings to authenticated;
grant usage, select on sequence public.product_sku_seq to authenticated;
grant execute on function public.is_staff(), public.is_admin(), public.my_role() to anon, authenticated;
grant execute on function public.create_order(jsonb, text, text, text, text, text) to anon, authenticated;
grant execute on function public.adjust_prices(numeric, uuid, int) to authenticated;
grant execute on function public.claim_invite() to authenticated;

-- ---------------------------------------------------------------------------
-- Function permissions
-- ---------------------------------------------------------------------------
grant execute on function public.create_order(jsonb, text, text, text, text, text) to anon, authenticated;
grant execute on function public.adjust_prices(numeric, uuid, int) to authenticated;
grant execute on function public.claim_invite() to authenticated;

-- ---------------------------------------------------------------------------
-- Image storage: public bucket, staff-only uploads, images only, max 2 MB
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "product images: staff read" on storage.objects
  for select to authenticated using (bucket_id = 'products' and public.is_staff());
create policy "product images: staff upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and public.is_staff());
create policy "product images: staff update" on storage.objects
  for update to authenticated using (bucket_id = 'products' and public.is_staff())
  with check (bucket_id = 'products' and public.is_staff());
create policy "product images: staff delete" on storage.objects
  for delete to authenticated using (bucket_id = 'products' and public.is_staff());

-- ---------------------------------------------------------------------------
-- Starting data: the store's real sections and contact details
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, icon, sort) values
  ('new-laptops',  'لابتوبات جديدة',   'laptop',  1),
  ('used-laptops', 'لابتوبات مستعملة', 'used',    2),
  ('accessories',  'إكسسوارات',        'mouse',   3),
  ('parts',        'قطع غيار',         'chip',    4),
  ('chargers',     'شواحن وبطاريات',   'battery', 5),
  ('storage',      'رام وتخزين',       'ram',     6);

insert into public.settings (
  id, store_name, whatsapp, phone_primary, phone_secondary, address, map_url, hours,
  delivery_note, facebook_url, tiktok_url, price_note, services_text
) values (
  1, 'نانو بايت تكنولوجي', '249126111169', '0126111169', '0912342256',
  'أم درمان - الشهداء - عمارة الهانم', 'https://maps.app.goo.gl/2hZUwaVUf4EwqMuRA',
  'من 9:00 صباحاً إلى 7:00 مساءً',
  'توصيل داخل ولاية الخرطوم ولكل الولايات الآمنة',
  'https://www.facebook.com/share/1EC5sgwS9M/', 'https://www.tiktok.com/@nano.byte.technol',
  'الأسعار تتغير باستمرار، ونؤكد لك السعر النهائي عند الطلب.',
  'صيانة اللابتوبات وتغيير القطع. اكتب لنا موديل جهازك والمشكلة، ونرد عليك بالتكلفة والمدة.'
);
