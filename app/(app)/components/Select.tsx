"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string | number; label: string };

type SelectProps = {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
};

export default function Select({ value, onChange, options, placeholder, className, style, ariaLabel }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => String(o.value) === String(value));

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

  return (
    <div ref={ref} className={`relative ${className ?? ""}`} style={style}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm text-left focus:outline-none"
        style={{
          background: "var(--input-bg)",
          border: open ? "1px solid var(--accent-text)" : "1px solid var(--input-border)",
          color: "var(--text-primary)",
        }}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate" style={{ color: selected ? "var(--text-primary)" : "var(--text-muted)" }}>
          {selected ? selected.label : placeholder ?? "Sélectionner…"}
        </span>
        <ChevronDown
          size={16}
          className="shrink-0 transition-transform"
          style={{ color: "var(--text-secondary)", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl overflow-hidden"
          role="listbox"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {options.map((opt) => {
            const isActive = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(String(opt.value));
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors"
                style={{
                  background: isActive ? "var(--accent-soft)" : "var(--surface)",
                  color: "var(--text-primary)",
                }}
              >
                <span className="truncate">{opt.label}</span>
                {isActive && <Check size={15} className="shrink-0" style={{ color: "var(--accent-text)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}