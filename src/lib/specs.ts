import type { Kind, Product } from "./types";
import { CONDITION_LABEL, formatStorage, genLabel } from "./format";

export const KIND_LABEL: Record<Kind, string> = {
  laptop: "لابتوب",
  accessory: "إكسسوار",
  part: "قطع غيار",
  charger: "شاحن / بطارية",
  storage: "رام / تخزين",
};

export interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  options?: string[];
}

/** Spec fields for non-laptop products (stored in `attrs`). Shared with the dashboard. */
export const KIND_FIELDS: Record<Exclude<Kind, "laptop">, FieldDef[]> = {
  accessory: [
    { key: "type", label: "النوع", options: ["ماوس", "كيبورد", "سماعة", "حقيبة لابتوب", "فلاش", "هارد خارجي", "كابلات ومحولات", "أخرى"] },
    { key: "compat", label: "متوافق مع", placeholder: "مثال: كل اللابتوبات / USB-C" },
    { key: "color", label: "اللون", placeholder: "أسود" },
  ],
  part: [
    { key: "type", label: "نوع القطعة", options: ["شاشة", "كيبورد", "مروحة", "مفصلات", "بورد", "سماعات داخلية", "كاميرا", "أخرى"] },
    { key: "compat", label: "متوافق مع الموديلات", placeholder: "HP 840 G5 / G6" },
  ],
  charger: [
    { key: "type", label: "النوع", options: ["شاحن لابتوب", "بطارية لابتوب", "شاحن USB-C", "أخرى"] },
    { key: "power", label: "القدرة / السعة", placeholder: "65W أو 4400mAh" },
    { key: "tip", label: "نوع الرأس", placeholder: "أزرق رفيع" },
    { key: "compat", label: "متوافق مع", placeholder: "HP EliteBook / ProBook" },
  ],
  storage: [
    { key: "type", label: "النوع", options: ["RAM", "SSD", "HDD", "فلاش", "أخرى"] },
    { key: "capacity", label: "السعة", placeholder: "8GB / 512GB" },
    { key: "interface", label: "الواجهة", options: ["DDR3", "DDR4", "DDR5", "SATA", "NVMe", "USB"] },
    { key: "for", label: "مخصص لـ", options: ["لابتوب", "كمبيوتر مكتبي", "الاثنين"] },
  ],
};

export interface SpecRow {
  icon: "cpu" | "ram" | "drive" | "gpu" | "screen" | "battery" | "shield" | "laptop" | "tag" | "link" | "palette" | "bolt";
  label: string;
  value: string;
}

const ATTR_ICON: Record<string, SpecRow["icon"]> = {
  type: "tag",
  compat: "link",
  color: "palette",
  power: "bolt",
  tip: "bolt",
  capacity: "drive",
  interface: "ram",
  for: "laptop",
};

export function specRows(p: Product): SpecRow[] {
  const rows: SpecRow[] = [];
  if (p.kind === "laptop") {
    if (p.cpu || p.cpu_family) rows.push({ icon: "cpu", label: "المعالج", value: (p.cpu || p.cpu_family) as string });
    if (p.cpu_gen) rows.push({ icon: "cpu", label: "جيل المعالج", value: genLabel(p.cpu_gen) });
    if (p.ram_gb) rows.push({ icon: "ram", label: "الرام", value: `${p.ram_gb}GB` });
    if (p.storage_gb) rows.push({ icon: "drive", label: "التخزين", value: `${p.storage_type ?? ""} ${formatStorage(p.storage_gb)}`.trim() });
    if (p.gpu) rows.push({ icon: "gpu", label: "كرت الشاشة", value: p.gpu });
    if (p.screen) rows.push({ icon: "screen", label: "الشاشة", value: p.screen });
    if (p.battery) rows.push({ icon: "battery", label: "البطارية", value: p.battery });
  } else {
    for (const f of KIND_FIELDS[p.kind]) {
      const v = p.attrs?.[f.key];
      if (v) rows.push({ icon: ATTR_ICON[f.key] ?? "tag", label: f.label, value: v });
    }
  }
  if (p.condition) rows.push({ icon: "laptop", label: "الحالة", value: CONDITION_LABEL[p.condition] });
  rows.push({ icon: "shield", label: "الضمان", value: p.warranty?.trim() || "يُحدد عند البيع" });
  return rows;
}
