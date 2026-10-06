"use client";

import { useCallback, useState } from "react";

interface CustomSliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
  ariaLabel?: string;
  disabled?: boolean;
}

export default function CustomSlider({
  value: controlled,
  min = 1,
  max = 3,
  step = 0.1,
  onChange,
  style,
  ariaLabel = "Curseur",
  disabled,
}: CustomSliderProps) {
  const [internal, setInternal] = useState<number>(controlled ?? min);

  const value = controlled !== undefined ? controlled : internal;
  const pct = min === max ? 0 : ((clamp(value) - min) / (max - min)) * 100;

  function clamp(n: number) {
    return Math.max(min, Math.min(max, n));
  }

  const commit = useCallback(
    (raw: number) => {
      const stepped = Math.round(raw / step) * step;
      const clamped = clamp(stepped);
      onChange?.(clamped);
      setInternal(clamped);
    },
    [min, max, step, onChange]
  );

  const setFromClientX = useCallback(
    (clientX: number, el: HTMLDivElement) => {
      const r = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      commit(min + ratio * (max - min));
    },
    [min, max, commit]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    const el = e.currentTarget;
    setFromClientX(e.clientX, el);
    const move = (ev: PointerEvent) => setFromClientX(ev.clientX, el);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = value + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - step;
    if (next === null) return;
    e.preventDefault();
    commit(Math.round(next / step) * step);
  };

  return (
    <div
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value * 100) / 100}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className={`relative h-6 flex flex-1 items-center touch-none outline-none ${disabled ? "opacity-50" : ""}`}
      style={style}
    >
      <div className="h-1.5 w-full rounded-full" style={{ background: "var(--border-subtle)" }} />
      <div
        className="absolute h-1.5 rounded-full"
        style={{ left: 0, width: `${pct}%`, background: "var(--gradient-button)" }}
      />
      <div
        className="absolute w-4 h-4 rounded-full shadow-md"
        style={{
          left: `calc(${pct}% - 8px)`,
          background: "#fff",
          border: "2px solid var(--accent, #056cf2)",
          cursor: disabled ? "not-allowed" : "grab",
        }}
      />
    </div>
  );
}