-- Owner's decision: don't show device condition (new/used/refurbished) to customers;
-- the shop explains it in person. One "لابتوبات" section instead of new/used.
update public.categories set name = 'لابتوبات', slug = 'laptops', icon = 'laptop', sort = 1 where slug = 'used-laptops';
update public.categories set is_visible = false, sort = 99 where slug = 'new-laptops';
update public.products set category_id = (select id from public.categories where slug = 'laptops') where kind = 'laptop';
update public.products set condition = null where condition is not null;
