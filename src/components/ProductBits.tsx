"use client";

import { BatteryCharging, Cpu, MemoryStick, Mouse } from "lucide-react";
import { imageUrl } from "@/lib/supabase";
import { CONDITION_LABEL, CURRENCY, discountPercent, formatPrice, specParts } from "@/lib/format";
import { Fragment } from "react";
import type { Condition, Kind, Product } from "@/lib/types";
import { LaptopArt } from "./icons";

const KIND_PLACEHOLDER: Record<Exclude<Kind, "laptop">, typeof Mouse> = {
  accessory: Mouse,
  part: Cpu,
  charger: BatteryCharging,
  storage: MemoryStick,
};

export function ProductPlaceholder({ kind, size = "md" }: { kind: Kind; size?: "sm" | "md" | "lg" }) {
  const w = size === "lg" ? "w-56" : size === "sm" ? "w-10" : "w-24";
  if (kind === "laptop") return <LaptopArt className={`${w} text-art`} />;
  const Icon = KIND_PLACEHOLDER[kind];
  const s = size === "lg" ? "size-24" : size === "sm" ? "size-7" : "size-12";
  return <Icon className={`${s} text-art`} strokeWidth={1.3} aria-hidden="true" />;
}

/** Product thumbnail, or a drawing when there is no photo yet. */
export function ProductThumb({
  product,
  className = "",
  size = "md",
  full = false,
}: {
  product: Product;
  className?: string;
  size?: "sm" | "md" | "lg";
  full?: boolean;
}) {
  const img = product.images[0];
  const src = imageUrl(full ? img?.path : img?.thumb || img?.path);
  return (
    <span className={`relative flex items-center justify-center overflow-hidden bg-tile ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={product.name} loading="lazy" decoding="async" className="size-full object-cover" />
      ) : (
        <ProductPlaceholder kind={product.kind} size={size} />
      )}
    </span>
  );
}

const COND_STYLE: Record<Condition, string> = {
  new: "bg-blue-bg text-blue-ink",
  used: "bg-amber-bg text-amber-ink",
  refurb: "bg-teal-bg text-teal-ink",
};

export function ConditionBadge({ condition, className = "" }: { condition: Condition | null; className?: string }) {
  if (!condition) return null;
  return (
    <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${COND_STYLE[condition]} ${className}`}>
      {CONDITION_LABEL[condition]}
    </span>
  );
}

export function DiscountBadge({ product, className = "" }: { product: Product; className?: string }) {
  const d = discountPercent(product);
  if (!d) return null;
  return (
    <span dir="ltr" className={`rounded-lg bg-magenta px-2 py-0.5 text-xs font-bold text-white ${className}`}>
      -{d}%
    </span>
  );
}

/** Spec summary with each part isolated, so mixed Arabic/English text keeps its order. */
export function SpecText({ product, className = "" }: { product: Product; className?: string }) {
  const parts = specParts(product);
  if (!parts.length) return null;
  return (
    <span className={className}>
      {parts.map((x, i) => (
        <Fragment key={i}>
          <bdi>{x}</bdi>
          {i < parts.length - 1 && " · "}
        </Fragment>
      ))}
    </span>
  );
}

export function Price({
  product,
  size = "md",
}: {
  product: Pick<Product, "price" | "old_price" | "price_on_request">;
  size?: "sm" | "md" | "lg";
}) {
  const big = size === "lg" ? "text-[26px]" : size === "sm" ? "text-sm" : "text-[15px]";
  if (product.price_on_request || product.price == null) {
    return <span className={`font-bold text-primary-ink ${size === "lg" ? "text-xl" : "text-sm"}`}>اسأل عن السعر</span>;
  }
  const showOld = product.old_price && product.old_price > product.price;
  return (
    <span className="flex flex-col leading-tight">
      {showOld && size !== "lg" && (
        <span className="text-xs text-faint line-through">{formatPrice(product.old_price)}</span>
      )}
      <span className={`${big} font-bold`}>
        {formatPrice(product.price)} <span className="text-xs font-medium">{CURRENCY}</span>
      </span>
    </span>
  );
}
