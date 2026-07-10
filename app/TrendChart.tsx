"use client";

import { useState, useRef } from "react";
import type { TrendPoint } from "./snapshot";

const ZOOM_PRESETS = [
  { label: "1Y", days: 365 },
  { label: "3M", days: 91 },
  { label: "1M", days: 30 },
  { label: "1W", days: 7 },
];

type Props = {
  data: TrendPoint[];
  label: string;
  unit?: string;
  color?: string;
  decimals?: number;
  defaultWindowDays?: number;
  today: string; // YYYY-MM-DD from the snapshot, so the window is stable
};

function daysBetween(dateStr: string, ref: Date): number {
  return Math.round((ref.getTime() - new Date(dateStr + "T00:00:00").getTime()) / 86400000);
}

// Single-series trend over a real-date window. Only actual readings are
// plotted — sparse data renders sparse, never interpolated. The average is
// window-scoped: it recomputes for the points in view on every zoom change.
export function TrendChart({ data, label, unit = "", color = "var(--accent)", decimals = 0, defaultWindowDays = 30, today }: Props) {
  const [windowDays, setWindowDays] = useState(defaultWindowDays);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 460, height = 120, padL = 34, padR = 46, padT = 12, padB = 22;
  const plotW = width - padL - padR, plotH = height - padT - padB;
  const ref = new Date(today + "T00:00:00");

  const sorted = data
    .filter((p) => { const a = daysBetween(p.date, ref); return a >= 0 && a <= windowDays; })
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const values = sorted.map((p) => p.value);
  const hasData = values.length > 0;
  const max = hasData ? Math.max(...values) : 1;
  const min = hasData ? Math.min(...values) : 0;
  const range = Math.max(max - min, 0.0001);
  const gMax = max + range * 0.15, gMin = min - range * 0.15, gRange = gMax - gMin;

  const xFor = (d: string) => padL + (1 - daysBetween(d, ref) / windowDays) * plotW;
  const yFor = (v: number) => padT + (1 - (v - gMin) / gRange) * plotH;
  const points = sorted.map((p) => ({ x: xFor(p.date), y: yFor(p.value), ...p }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const avg = hasData ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const last = points[points.length - 1];

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0, bd = Infinity;
    points.forEach((p, i) => { const d = Math.abs(p.x - px); if (d < bd) { bd = d; best = i; } });
    setHoverIdx(best);
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)" }}>{label}</span>
        {last && <span style={{ fontSize: 20, fontWeight: 600, color }}>{last.value.toFixed(decimals)}<span style={{ fontSize: 11, color: "var(--ink-soft)", marginLeft: 4 }}>{unit}</span></span>}
      </div>
      <div style={{ display: "flex", gap: 4, margin: "6px 0" }}>
        {ZOOM_PRESETS.map((z) => (
          <button key={z.label} className="zoom-pill" data-active={z.days === windowDays} onClick={() => setWindowDays(z.days)}>{z.label}</button>
        ))}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} width="100%" height={height} onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)} style={{ overflow: "visible", cursor: hasData ? "crosshair" : "default" }}>
        {avg !== null && points.length > 1 && (
          <>
            <line x1={padL} x2={width - padR} y1={yFor(avg)} y2={yFor(avg)} stroke="var(--ink-soft)" strokeWidth={1} strokeDasharray="4,3" opacity={0.55} />
            <text x={width - padR + 4} y={yFor(avg) + 3} fontSize="9" fontFamily="var(--mono)" fill="var(--ink-soft)">avg {avg.toFixed(decimals)}</text>
          </>
        )}
        {hoverIdx !== null && points[hoverIdx] && (
          <line x1={points[hoverIdx].x} x2={points[hoverIdx].x} y1={padT} y2={height - padB} stroke="var(--ink-soft)" strokeWidth={1} strokeDasharray="2,2" />
        )}
        {points.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 || i === hoverIdx ? 4 : 2.5} fill={color} opacity={i === points.length - 1 || i === hoverIdx ? 1 : 0.7} />
        ))}
        {!hasData && <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="11" fontFamily="var(--mono)" fill="var(--ink-soft)">No data in window</text>}
      </svg>
      <div className="hint">
        {hoverIdx !== null && points[hoverIdx]
          ? `${points[hoverIdx].date}: ${points[hoverIdx].value.toFixed(decimals)} ${unit}`
          : `${points.length} real reading${points.length === 1 ? "" : "s"} in the last ${windowDays} days${avg !== null ? ` · avg ${avg.toFixed(decimals)}${unit ? ` ${unit}` : ""}` : ""}`}
      </div>
    </div>
  );
}
