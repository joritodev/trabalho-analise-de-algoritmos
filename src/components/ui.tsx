"use client";

import type { ReactNode } from "react";

/** Layout split-screen: controles à esquerda, palco de visualização à direita. */
export function SplitLayout({ controls, stage }: { controls: ReactNode; stage: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="w-full shrink-0 border-b border-line bg-surface lg:w-[340px] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-5 p-5">{controls}</div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6">{stage}</div>
      </main>
    </div>
  );
}

export function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-3 uppercase">{title}</h3>
        {hint && <span className="font-mono text-[11px] text-ink-3">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "", title, right }: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-line bg-surface ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="font-mono text-xs text-ink-2">{title}</div>
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function TextField({ label, value, onChange, maxLength = 12 }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex justify-between text-xs text-ink-2">
        {label}
        <span className="font-mono text-ink-3">
          {value.length}/{maxLength}
        </span>
      </span>
      <input
        value={value}
        maxLength={maxLength}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s/g, ""))}
        className="rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
      />
    </label>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, format }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex justify-between text-xs text-ink-2">
        {label}
        <span className="font-mono text-ink">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
    </label>
  );
}

export function Button({ children, onClick, disabled, variant = "ghost", title, className = "" }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  title?: string;
  className?: string;
}) {
  const styles = {
    primary: "bg-accent text-white hover:brightness-110 border-transparent",
    ghost: "bg-surface-2 text-ink hover:bg-surface-3 border-line",
    danger: "bg-dup/15 text-dup hover:bg-dup/25 border-dup/30",
  }[variant];
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${
            value === o.value ? "bg-surface-3 text-ink shadow-sm" : "text-ink-3 hover:text-ink-2"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-surface px-4 py-3">
      <span className="text-xs text-ink-3">{label}</span>
      <span className="truncate font-mono text-xl font-semibold text-ink tabular-nums" style={tone ? { color: tone } : undefined}>
        {value}
      </span>
      {sub && <span className="font-mono text-[11px] text-ink-3">{sub}</span>}
    </div>
  );
}

export function LegendItem({ color, label, swatch = "square" }: { color: string; label: string; swatch?: "square" | "line" | "dash" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
      {swatch === "square" && <span className="size-2.5 rounded-[3px]" style={{ background: color }} />}
      {swatch === "line" && <span className="h-0.5 w-4 rounded" style={{ background: color }} />}
      {swatch === "dash" && (
        <span className="h-0.5 w-4" style={{ backgroundImage: `linear-gradient(90deg, ${color} 60%, transparent 0)`, backgroundSize: "6px 2px" }} />
      )}
      {label}
    </span>
  );
}

export function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs leading-relaxed text-ink-2">
      {children}
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-2 text-[13px] leading-relaxed text-ink-2 [&_b]:font-medium [&_b]:text-ink">{children}</div>;
}

export const fmtInt = (n: number) => (Number.isFinite(n) ? Math.round(n).toLocaleString("pt-BR") : "∞");

export function fmtCompact(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (Math.abs(n) < 1e4) return fmtInt(n);
  const exp = Math.floor(Math.log10(Math.abs(n)));
  return `${(n / 10 ** exp).toFixed(2).replace(".", ",")}·10${superscript(exp)}`;
}

function superscript(n: number) {
  const map: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  return String(n).split("").map((c) => map[c]).join("");
}

export function fmtBytes(b: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b < 10 && i > 0 ? b.toFixed(2) : b < 100 && i > 0 ? b.toFixed(1) : Math.round(b)} ${units[i]}`.replace(".", ",");
}
