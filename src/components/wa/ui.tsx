"use client";

import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { WaIcon, type WaIconName } from "./Icon";
import { cx } from "./tokens";

/* Primitives for the WhatsApp agent dashboard. Values come straight from the design handoff
   (design/tokens.css and reference/source/*.dc.html): every size, colour and radius is in the class strings. */


/** Visible cyan focus ring on every interactive element. */
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

/* ---------- surfaces ---------- */

export function Card({ as: Tag = "div", className, ...rest }: { as?: "div" | "section" | "article"; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return <Tag className={cx("rounded-[22px] border border-[rgba(255,255,255,.09)] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,.05)]", className)} {...rest} />;
}

export function Glass({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("border border-[rgba(255,255,255,.10)] bg-[rgba(255,255,255,.035)] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]", className)} {...rest} />;
}

/** Rounded icon tile. `color` tints the fill and border the way the reference does (hex + 1A / 40). */
export function Tile({ size = 38, radius = 12, color, className, children, style }: { size?: number; radius?: number; color?: string; className?: string; children?: ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size, borderRadius: radius, ...(color ? { background: `${color}1A`, border: `1px solid ${color}40` } : {}), ...style }}
    >
      {children}
    </span>
  );
}

/* ---------- buttons ---------- */

type BtnProps = { href?: string; icon?: WaIconName; iconRight?: WaIconName; children?: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>;

function make(base: string, iconStroke: string, iconStrokeWidth = 1.8) {
  return function Button({ href, icon, iconRight, children, className, type = "button", ...rest }: BtnProps) {
    const body = (
      <>
        {icon && <WaIcon name={icon} size={16} stroke={iconStroke} strokeWidth={iconStrokeWidth} />}
        {children}
        {iconRight && <WaIcon name={iconRight} size={16} stroke={iconStroke} strokeWidth={iconStrokeWidth} />}
      </>
    );
    const cls = cx(base, FOCUS, className);
    if (href) return <Link href={href} className={cls}>{body}</Link>;
    return <button type={type} className={cls} {...rest}>{body}</button>;
  };
}

/** The one mint pill per screen. */
export const PrimaryButton = make(
  "inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border-0 bg-mint px-[18px] text-[14.5px] font-semibold text-void shadow-[0_0_24px_rgba(61,220,151,.22)] disabled:cursor-not-allowed disabled:opacity-50",
  "#05060A",
  2,
);
export const GlassButton = make(
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.035)] px-4 text-[14px] text-soft disabled:cursor-not-allowed disabled:opacity-50",
  "#C9CCD4",
);
export const GhostButton = make(
  "inline-flex h-[34px] cursor-pointer items-center gap-[7px] whitespace-nowrap rounded-[10px] border-0 bg-transparent px-[10px] text-[13.5px] text-mist hover:bg-[rgba(255,255,255,.05)] hover:text-frost disabled:cursor-not-allowed disabled:opacity-50",
  "currentColor",
);

export const IconButton = forwardRef<HTMLButtonElement, { icon: WaIconName; label: string; stroke?: string; strokeWidth?: number; href?: string } & ButtonHTMLAttributes<HTMLButtonElement>>(function IconButton(
  { icon, label, stroke = "#C9CCD4", strokeWidth = 1.8, href, className, type = "button", ...rest },
  ref,
) {
  const cls = cx("inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[11px] border border-[rgba(255,255,255,.10)] bg-[rgba(255,255,255,.03)]", FOCUS, className);
  const glyph = <WaIcon name={icon} size={icon === "dots" ? 18 : 15} stroke={stroke} strokeWidth={icon === "dots" ? 3 : strokeWidth} />;
  if (href) return <Link href={href} aria-label={label} className={cls}>{glyph}</Link>;
  return (
    <button ref={ref} type={type} aria-label={label} className={cls} {...rest}>
      {glyph}
    </button>
  );
});

/* ---------- pills ---------- */

export const Pill = forwardRef<HTMLSpanElement, { color: string; dot?: boolean; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLSpanElement>>(function Pill({ color, dot = true, className, children, style, ...rest }, ref) {
  return (
    <span
      ref={ref}
      className={cx("inline-flex h-[26px] items-center gap-[6px] whitespace-nowrap rounded-full px-[10px] font-mono text-[11px] uppercase tracking-[.06em]", className)}
      style={{ background: `${color}1A`, border: `1px solid ${color}55`, color, ...style }}
      {...rest}
    >
      {dot && <span className="h-[6px] w-[6px] rounded-[3px]" style={{ background: color }} />}
      {children}
    </span>
  );
});

/** Neutral chip (example topics, language codes). */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex h-6 items-center rounded-full border border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.05)] px-[10px] text-[12.5px] text-mist", className)}>{children}</span>;
}

/* ---------- form controls ---------- */

export function Toggle({ checked, onChange, label, disabled, name }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean; name?: string }) {
  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative h-[26px] w-[44px] shrink-0 cursor-pointer rounded-[13px] border p-0 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "border-[rgba(61,220,151,.6)] bg-[rgba(61,220,151,.30)]" : "border-[rgba(255,255,255,.16)] bg-[rgba(255,255,255,.06)]",
          FOCUS,
        )}
      >
        <span className={cx("absolute top-[3px] h-[18px] w-[18px] rounded-[9px] transition-[left] duration-150", checked ? "left-[21px] bg-mint-text" : "left-[3px] bg-dim")} />
      </button>
      {name && checked && <input type="hidden" name={name} value="on" />}
    </>
  );
}

/** Text-field look, shared with controls that must match inputs (the package Type listbox). */
export const INPUT =
  "box-border h-[46px] w-full rounded-[14px] border border-[rgba(255,255,255,.12)] bg-[rgba(255,255,255,.04)] px-[14px] font-sans text-[15px] text-frost outline-none placeholder:text-dim focus:border-[rgba(92,200,255,.6)] focus:shadow-[0_0_0_3px_rgba(92,200,255,.15)] disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, { mono?: boolean } & InputHTMLAttributes<HTMLInputElement>>(function Input({ mono, className, ...rest }, ref) {
  return <input ref={ref} className={cx(INPUT, mono && "font-mono", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows = 6, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cx(INPUT, "h-auto resize-y px-[14px] py-3 leading-[1.55]", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx(INPUT, "cursor-pointer appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23A9AEBA' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")" }} {...rest}>
      {children}
    </select>
  );
});

/** Mono uppercase label, the design's `.lab`. */
export function Label({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx("font-mono text-[11.5px] uppercase tracking-[.16em] text-dim", className)} {...rest}>
      {children}
    </span>
  );
}

/** Form field label, the design's `.fl`. */
export function FieldLabel({ htmlFor, children, className }: { htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cx("mb-2 block text-[13.5px] text-soft", className)}>
      {children}
    </label>
  );
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mt-2 text-[13px] leading-[1.5] text-dim", className)}>{children}</div>;
}

/* ---------- segmented control ---------- */

export function Segmented<T extends string>({ options, value, onChange, label, size = "md", className }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string; size?: "sm" | "md"; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("flex gap-1 rounded-xl border border-[rgba(255,255,255,.08)] bg-[rgba(255,255,255,.03)] p-1", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx("cursor-pointer rounded-[9px] border-0 text-[13.5px]", size === "sm" ? "h-8 flex-1 text-[13px]" : "h-[34px] px-[14px]", on ? "bg-[rgba(255,255,255,.09)] text-frost" : "bg-transparent text-mist", FOCUS)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- popover menu (Radix Popover) ---------- */

export function PopoverMenu({ trigger, children, align = "start", width = 230, offset = 8, role = "menu", label, open, onOpenChange }: { trigger: ReactNode; children: ReactNode; align?: "start" | "end"; width?: number; offset?: number; role?: "menu" | "listbox"; label?: string; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          role={role}
          aria-label={label}
          align={align}
          sideOffset={offset}
          collisionPadding={16}
          style={{ width }}
          className="z-50 rounded-2xl border border-[rgba(255,255,255,.14)] bg-popover p-[6px] shadow-[0_24px_60px_rgba(0,0,0,.65)] outline-none"
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function MenuItem({ icon, tone = "default", children, ...rest }: { icon?: WaIconName; tone?: "default" | "danger" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const color = tone === "danger" ? "#FF9BB0" : "#C9CCD4";
  return (
    <button type="button" role="menuitem" className={cx("inline-flex h-10 w-full cursor-pointer items-center gap-[7px] rounded-[10px] border-0 bg-transparent px-[10px] text-left text-[13.5px] hover:bg-[rgba(255,255,255,.05)]", FOCUS)} style={{ color }} {...rest}>
      {icon && <WaIcon name={icon} size={16} stroke={color} />}
      {children}
    </button>
  );
}

/* ---------- page header ---------- */

export function PageHeader({ title, subtitle, actions, titleTag }: { title: string; subtitle?: ReactNode; actions?: ReactNode; titleTag?: ReactNode }) {
  return (
    <div className="mb-7 flex items-end gap-5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h1 className="m-0 text-[38px] font-semibold leading-[1.05] tracking-[-0.035em]">{title}</h1>
          {titleTag}
        </div>
        {subtitle && <p className="mb-0 mt-[10px] text-[15.5px] leading-[1.5] text-mist">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-[10px]">{actions}</div>}
    </div>
  );
}
