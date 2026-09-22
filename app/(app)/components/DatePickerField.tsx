"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react";

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const parseISO = (s: string | null | undefined): { y: number; m: number; d: number } | null => {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
};

const compareISO = (a: string | null | undefined, b: string | null | undefined) => {
  const pa = parseISO(a);
  const pb = parseISO(b);
  if (!pa || !pb) return -1;
  const da = new Date(pa.y, pa.m, pa.d).getTime();
  const db = new Date(pb.y, pb.m, pb.d).getTime();
  return da < db ? -1 : da > db ? 1 : 0;
};

const isSameDay = (y: number, m: number, d: number, iso: string | null | undefined) => {
  const p = parseISO(iso);
  return !!p && p.y === y && p.m === m && p.d === d;
};

const formatDisplay = (s: string | null | undefined): string => {
  const p = parseISO(s);
  if (!p) return "";
  const d = new Date(p.y, p.m, p.d);
  const label = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} — ${label}`;
};

export default function DatePickerField({
  value,
  onChange,
  min,
  max,
  placeholder = "Choisir une date",
  className = "",
  style,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  min?: string | null | undefined;
  max?: string | null | undefined;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [viewAnchor, setViewAnchor] = useState<{ y: number; m: number } | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; flipUp: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  const close = () => {
    setOpen(false);
    setPos(null);
  };

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (open) {
      close();
      return;
    }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const p = parseISO(value) ?? parseISO(todayISO);
      setViewAnchor({ y: p ? p.y : today.getFullYear(), m: p ? p.m : today.getMonth() });
      const spaceBelow = window.innerHeight - rect.bottom;
      const flipUp = spaceBelow < 340;
      setPos({
        top: flipUp ? Math.max(8, rect.top - 12) : rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 340),
        width: Math.min(rect.width, 340),
        flipUp,
      });
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const nav = (dir: 1 | -1) => {
    if (!viewAnchor || !open) return;
    const d = new Date(viewAnchor.y, viewAnchor.m + dir, 1);
    setViewAnchor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const cells: (number | null)[] = [];
  if (viewAnchor && open) {
    const first = new Date(viewAnchor.y, viewAnchor.m, 1);
    const startDow = (first.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(viewAnchor.y, viewAnchor.m + 1, 0).getDate();
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  }

  const display = formatDisplay(value) || placeholder;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all duration-200"
        style={{ ...style, cursor: "pointer" }}
        title={display}
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          <CalendarIcon size={15} className="shrink-0" style={{ color: value ? "var(--accent-text, #056cf2)" : "var(--text-muted)" }} />
          <span className="truncate" style={{ color: value ? (style?.color ?? "var(--text-primary)") : "var(--text-muted)" }}>
            {display}
          </span>
        </span>
        <ChevronRight size={14} className="shrink-0 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none", color: "var(--text-muted)" }} />
      </button>

      {open && viewAnchor && pos && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div
            ref={panelRef}
            className="fixed z-50 rounded-2xl p-4"
            style={{
              top: pos.top,
              left: pos.left,
              width: Math.max(pos.width, 300),
              background: "var(--chrome-card, var(--card-bg))",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 18px 44px -18px rgba(10,27,60,0.4)",
            }}
          >
            {/* En-tête mois/année */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <button
                type="button"
                onClick={() => nav(-1)}
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors hover:bg-[var(--hover-soft)]"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Mois précédent"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-sm font-bold capitalize" style={{ color: "var(--text-primary)" }}>
                {MONTHS[viewAnchor.m]} {viewAnchor.y}
              </div>
              <button
                type="button"
                onClick={() => nav(1)}
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors hover:bg-[var(--hover-soft)]"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Mois suivant"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Grille */}
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[10px] font-bold uppercase tracking-wide py-1" style={{ color: "var(--text-muted)" }}>
                  {w}
                </div>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <div key={`e${i}`} />;
                const iso = toISO(viewAnchor.y, viewAnchor.m, d);
                const selected = isSameDay(viewAnchor.y, viewAnchor.m, d, value);
                const isToday = iso === todayISO;
                const beforeMin = !!min && compareISO(iso, min) < 0;
                const afterMax = !!max && compareISO(iso, max) > 0;
                const disabled = beforeMin || afterMax;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => { onChange(iso); close(); }}
                    className="h-9 rounded-lg text-xs font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                    style={
                      selected
                        ? { background: "var(--gradient-button)", color: "#fff", boxShadow: "0 6px 14px -6px rgba(37,99,235,0.45)" }
                        : isToday
                          ? { background: "rgba(5,108,242,0.10)", color: "#056cf2", border: "1px solid rgba(5,108,242,0.4)" }
                          : { color: "var(--text-primary)", border: "1px solid transparent" }
                    }
                    onMouseEnter={(e) => {
                      if (!selected) (e.currentTarget as HTMLElement).style.background = "var(--hover-soft)";
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Actions rapides */}
            <div className="mt-3 pt-3 flex items-center justify-between gap-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                type="button"
                onClick={() => { onChange(todayISO); close(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors hover:bg-[var(--hover-soft)]"
                style={{ color: "#056cf2" }}
              >
                <Check size={12} /> Aujourd&apos;hui
              </button>
              <button
                type="button"
                onClick={() => { onChange(""); close(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors hover:bg-[var(--hover-soft)]"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={12} /> Effacer
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}