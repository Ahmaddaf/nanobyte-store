import {
  BatteryCharging,
  Cpu,
  HardDrive,
  Laptop,
  Link2,
  MemoryStick,
  Monitor,
  Mouse,
  Palette,
  Percent,
  RefreshCw,
  ShieldCheck,
  Tag,
  Wrench,
  Zap,
  Headphones,
  Keyboard,
  Usb,
  Package,
  type LucideIcon,
} from "lucide-react";

/** Icons the dashboard can assign to a category (stored as the key). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  laptop: Laptop,
  used: RefreshCw,
  mouse: Mouse,
  chip: Cpu,
  battery: BatteryCharging,
  ram: MemoryStick,
  drive: HardDrive,
  percent: Percent,
  wrench: Wrench,
  headphones: Headphones,
  keyboard: Keyboard,
  usb: Usb,
  monitor: Monitor,
  box: Package,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Package;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.8} />;
}

export const SPEC_ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  ram: MemoryStick,
  drive: HardDrive,
  gpu: Monitor,
  screen: Monitor,
  battery: BatteryCharging,
  shield: ShieldCheck,
  laptop: Laptop,
  tag: Tag,
  link: Link2,
  palette: Palette,
  bolt: Zap,
};

/** Simple line drawing used when a product has no photo yet. */
export function LaptopArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" className={className} aria-hidden="true">
      <rect x="22" y="8" width="76" height="52" rx="5" />
      <rect x="29" y="15" width="62" height="38" rx="2" strokeWidth={2} />
      <path d="M8 66h104l-6 8H14l-6-8Z" />
      <path d="M52 66v3h16v-3" />
    </svg>
  );
}

/** WhatsApp-style chat bubble (generic, not the trademark logo). */
export function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z" />
      <path d="M9 10.5h6M9 13.5h4" />
    </svg>
  );
}
