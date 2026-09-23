"use client";

import { useEffect, useRef, useState } from "react";
import { fr } from "react-day-picker/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
};

const MIN_HEIGHT = 340;

const toDate = (iso: string | undefined): Date | undefined => {
  if (!iso) return undefined;
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
};

type Position = "up" | "down";

export default function DatePicker({ value, onChange, min, max, placeholder, className, style }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>("down");
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const setOpenDirect = (v: boolean) => {
    if (v && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      if (spaceBelow < MIN_HEIGHT && spaceAbove > spaceBelow) {
        setPosition("up");
        setMaxHeight(spaceAbove);
      } else {
        setPosition("down");
        setMaxHeight(spaceBelow);
      }
    }
    setOpen(v);
  };

  const formatDisplay = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div ref={ref} className={`relative ${className ?? ""}`} style={style}>
      <button
        type="button"
        onClick={() => setOpenDirect(open ? false : true)}
        className="w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-left focus:outline-none"
        style={{
          background: "var(--input-bg)",
          border: open ? "1px solid var(--accent-text)" : "1px solid var(--input-border)",
          color: "var(--text-primary)",
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays size={15} className="shrink-0" style={{ color: "var(--text-secondary)" }} />
        <span className="truncate" style={{ color: selected ? "var(--text-primary)" : "var(--text-muted)" }}>
          {selected ? formatDisplay(selected) : placeholder ?? "Sélectionner une date"}
        </span>
      </button>

      {open && (
        <div
          className={`absolute z-50 ${position === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"} left-0 rounded-2xl p-3`}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
            maxHeight: maxHeight ?? undefined,
            overflowY: "auto",
          }}
        >
          <DayPicker
            mode="single"
            locale={fr}
            defaultMonth={selected ?? undefined}
            selected={selected}
            onSelect={(day) => {
              if (day) {
                const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                onChange(iso);
              }
              setOpen(false);
            }}
            disabled={(day) => {
              if (selected && day.getFullYear() === selected.getFullYear() && day.getMonth() === selected.getMonth() && day.getDate() === selected.getDate()) {
                return false;
              }
              return (
                (minDate ? day < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : false) ||
                (maxDate ? day > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : false)
              );
            }}
            showOutsideDays
            classNames={{
              root: "text-[13px]",
              months: "flex flex-col",
              month: "space-y-2",
              caption: "flex items-center justify-between py-1",
              caption_label: "text-sm font-bold capitalize text-left flex-1",
              nav: "flex items-center gap-1 pl-2",
              button_previous:
                "flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95",
              button_next: "flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95",
              weekdays: "flex w-full",
              weekday: "w-9 text-[11px] font-semibold text-center uppercase",
              week: "flex w-full mt-1",
              month_grid: "w-full",
              day: "",
              day_button: "",
              selected: "font-bold",
              today: "font-bold underline underline-offset-2",
            }}
            styles={{
              caption: { color: "var(--text-primary)" },
              weekday: { color: "var(--text-secondary)" },
              button_previous: {
                color: "var(--text-primary)",
                background: "var(--hover-soft)",
                border: "1px solid var(--border-subtle)",
                width: "30px",
                height: "30px",
                cursor: "pointer",
              },
              button_next: {
                color: "var(--text-primary)",
                background: "var(--hover-soft)",
                border: "1px solid var(--border-subtle)",
                width: "30px",
                height: "30px",
                cursor: "pointer",
              },
              day: { color: "var(--text-primary)" },
              day_button: { width: "36px", height: "36px", fontSize: "13px", borderRadius: "8px" },
            }}
            modifiersStyles={{
              disabled: { color: "var(--text-muted)", opacity: 0.5 },
              outside: { color: "var(--text-muted)", opacity: 0.45 },
              selected: {
                background: "var(--accent-soft)",
                color: "var(--accent-text)",
                border: "2px solid var(--accent-text)",
                borderRadius: "10px",
              },
              today: { color: "var(--accent-text)", fontWeight: 700 },
            }}
            components={{
              Chevron: ({ orientation }) => {
                if (orientation === "left") return <ChevronLeft size={18} aria-hidden />;
                if (orientation === "right") return <ChevronRight size={18} aria-hidden />;
                return <span aria-hidden />;
              },
            }}
          />
        </div>
      )}
    </div>
  );
}