"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectFieldProps {
  options: CustomSelectOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  resetAfterChange?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

const DEFAULT_STYLE: React.CSSProperties = {
  background: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--text-primary)",
};

export default function CustomSelectField({
  options,
  value: controlledValue,
  placeholder = "Sélectionner…",
  disabled,
  resetAfterChange,
  onChange,
  className = "",
  style,
  ariaLabel,
}: CustomSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<string>(controlledValue ?? "");
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internal;
  const current = options.find((o) => o.value === value);

  useLayoutEffect(() => {
    if (!open) return;
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const preferredHeight = Math.min(280, 8 + options.length * 41 + 16);
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const flip = spaceBelow < preferredHeight && r.top > spaceBelow;
    const menuH = flip ? Math.min(preferredHeight, r.top - 8) : Math.min(preferredHeight, spaceBelow);
    const left = Math.min(r.left, window.innerWidth - Math.min(Math.max(r.width, 200), 320) - 8);
    setPos({
      top: flip ? r.top - menuH - 4 : r.bottom + 6,
      left,
      width: Math.max(r.width, 200),
    });
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const reset = () => {
      setOpen(false);
      setPos(null);
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", reset);
    window.addEventListener("scroll", reset, true);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", reset);
      window.removeEventListener("scroll", reset, true);
    };
  }, [open]);

  const selectOption = (opt: CustomSelectOption) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setInternal(resetAfterChange ? "" : opt.value);
    setOpen(false);
  };

  const menu =
    open && pos
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[70] rounded-xl py-1.5 shadow-xl overflow-y-auto"
            style={{
              ...pos,
              maxHeight: 280,
              background: "var(--card-bg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Aucune option
              </p>
            ) : (
              options.map((opt) => {
                const selected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => selectOption(opt)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={
                      selected
                        ? { background: "rgba(5,108,242,0.08)" }
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = selected ? "rgba(5,108,242,0.08)" : "rgba(5,108,242,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selected ? "rgba(5,108,242,0.08)" : "transparent";
                    }}
                  >
                    {opt.icon ? <span className="shrink-0">{opt.icon}</span> : null}
                    <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                      {opt.label}
                    </span>
                    {selected && <Check size={16} style={{ color: "var(--accent, #056cf2)" }} />}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm font-medium outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{ ...DEFAULT_STYLE, ...style, cursor: disabled ? "not-allowed" : "pointer", boxShadow: open ? "0 0 0 3px rgba(5,108,242,0.12)" : "none" }}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          {current?.icon ?? null}
          <span className="truncate" style={{ color: current ? "var(--text-primary)" : "var(--text-muted)" }}>
            {current ? current.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className="shrink-0"
          style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        />
      </button>
      {menu}
    </div>
  );
}