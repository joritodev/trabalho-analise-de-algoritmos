"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface Series {
  id: string;
  label: string;
  color: string;
  dashed?: boolean;
  points: { x: number; y: number }[];
}

interface Props {
  series: Series[];
  logY?: boolean;
  height?: number;
  xLabel: string;
  yLabel: string;
  formatY?: (v: number) => string;
  formatX?: (v: number) => string;
  /** Linhas horizontais de referência (ex.: limites teóricos). */
  refLines?: { y: number; label: string }[];
  yDomain?: [number, number];
}

const M = { top: 12, right: 16, bottom: 36, left: 64 };

export function LineChart({ series, logY = false, height = 300, xLabel, yLabel, formatY = String, formatX = String, refLines = [], yDomain }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const all = series.flatMap((s) => s.points).filter((p) => Number.isFinite(p.y) && (!logY || p.y > 0));
  const xs = [...new Set(all.map((p) => p.x))].sort((a, b) => a - b);

  const { x0, x1, y0, y1 } = useMemo(() => {
    const xVals = all.map((p) => p.x);
    const yVals = [...all.map((p) => p.y), ...refLines.map((r) => r.y)];
    let lo = yDomain?.[0] ?? (yVals.length ? Math.min(...yVals) : 1);
    let hi = yDomain?.[1] ?? (yVals.length ? Math.max(...yVals) : 10);
    if (logY) {
      lo = 10 ** Math.floor(Math.log10(Math.max(lo, 1e-9)));
      hi = 10 ** Math.ceil(Math.log10(Math.max(hi, lo * 10)));
    } else if (!yDomain) {
      lo = Math.min(0, lo);
      hi = hi === lo ? lo + 1 : hi * 1.08;
    }
    return { x0: xVals.length ? Math.min(...xVals) : 0, x1: xVals.length ? Math.max(...xVals) : 1, y0: lo, y1: hi };
  }, [all, logY, refLines, yDomain]);

  const iw = Math.max(10, width - M.left - M.right);
  const ih = height - M.top - M.bottom;
  const sx = (x: number) => M.left + (x1 === x0 ? iw / 2 : ((x - x0) / (x1 - x0)) * iw);
  const sy = (y: number) => {
    const t = logY ? (Math.log10(y) - Math.log10(y0)) / (Math.log10(y1) - Math.log10(y0)) : (y - y0) / (y1 - y0);
    return M.top + ih - Math.min(1.05, Math.max(-0.05, t)) * ih;
  };

  const yTicks = useMemo(() => {
    if (logY) {
      const lo = Math.log10(y0), hi = Math.log10(y1);
      const step = Math.max(1, Math.ceil((hi - lo) / 6));
      const out: number[] = [];
      for (let e = lo; e <= hi; e += step) out.push(10 ** e);
      return out;
    }
    const raw = (y1 - y0) / 5;
    const mag = 10 ** Math.floor(Math.log10(raw || 1));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
    const out: number[] = [];
    for (let v = Math.ceil(y0 / step) * step; v <= y1 + 1e-9; v += step) out.push(v);
    return out;
  }, [logY, y0, y1]);

  const xTicks = useMemo(() => {
    if (xs.length <= 12) return xs;
    const every = Math.ceil(xs.length / 10);
    return xs.filter((_, i) => i % every === 0);
  }, [xs]);

  const hoverPts = hoverX === null ? [] : series.map((s) => ({ s, p: s.points.find((p) => p.x === hoverX) })).filter((h) => h.p && Number.isFinite(h.p.y));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!xs.length) return;
    const rect = (e.target as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - rect.left + M.left;
    let best = xs[0];
    for (const x of xs) if (Math.abs(sx(x) - px) < Math.abs(sx(best) - px)) best = x;
    setHoverX(best);
  };

  return (
    <div ref={ref} className="relative w-full select-none">
      <svg width={width} height={height} className="block overflow-visible">
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={M.left + iw} y1={sy(v)} y2={sy(v)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={M.left - 8} y={sy(v)} dy="0.32em" textAnchor="end" className="fill-ink-3 font-mono text-[10px]">
              {formatY(v)}
            </text>
          </g>
        ))}
        {xTicks.map((x) => (
          <text key={x} x={sx(x)} y={M.top + ih + 16} textAnchor="middle" className="fill-ink-3 font-mono text-[10px]">
            {formatX(x)}
          </text>
        ))}
        <text x={M.left + iw / 2} y={height - 4} textAnchor="middle" className="fill-ink-3 text-[11px]">{xLabel}</text>
        <text transform={`translate(12 ${M.top + ih / 2}) rotate(-90)`} textAnchor="middle" className="fill-ink-3 text-[11px]">{yLabel}</text>

        {refLines.map((r) => (
          <g key={r.label}>
            <line x1={M.left} x2={M.left + iw} y1={sy(r.y)} y2={sy(r.y)} stroke="var(--color-ink-3)" strokeDasharray="2 4" />
            <text x={M.left + iw - 4} y={sy(r.y) - 5} textAnchor="end" className="fill-ink-3 font-mono text-[10px]">{r.label}</text>
          </g>
        ))}

        {series.map((s) => {
          const pts = s.points.filter((p) => Number.isFinite(p.y) && (!logY || p.y > 0));
          if (!pts.length) return null;
          return (
            <g key={s.id}>
              <polyline
                points={pts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "5 5" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {pts.length <= 40 && pts.map((p) => (
                <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={s.dashed ? 2.5 : 3.5} fill={s.dashed ? "var(--color-surface)" : s.color} stroke={s.dashed ? s.color : "var(--color-surface)"} strokeWidth={s.dashed ? 1.5 : 2} />
              ))}
            </g>
          );
        })}

        {hoverX !== null && (
          <g pointerEvents="none">
            <line x1={sx(hoverX)} x2={sx(hoverX)} y1={M.top} y2={M.top + ih} stroke="var(--color-ink-3)" strokeWidth={1} />
            {hoverPts.map(({ s, p }) => (
              <circle key={s.id} cx={sx(p!.x)} cy={sy(p!.y)} r={5} fill={s.color} stroke="var(--color-surface)" strokeWidth={2} />
            ))}
          </g>
        )}
        <rect x={M.left} y={M.top} width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHoverX(null)} />
      </svg>

      {hoverX !== null && hoverPts.length > 0 && (
        <div
          className="pointer-events-none absolute z-10 min-w-44 rounded-lg border border-line-strong bg-surface-3/95 px-3 py-2 shadow-xl backdrop-blur"
          style={{ left: Math.min(sx(hoverX) + 12, width - 200), top: M.top }}
        >
          <div className="mb-1 font-mono text-[11px] text-ink-3">{xLabel.split(" ")[0]} = {formatX(hoverX)}</div>
          {hoverPts.map(({ s, p }) => (
            <div key={s.id} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-ink-2">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-mono text-ink tabular-nums">{formatY(p!.y)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
