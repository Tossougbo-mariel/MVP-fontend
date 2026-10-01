"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
];

/**
 * Sélecteur de thème clair / sombre.
 *
 * Habité dans la page Paramètres de l'agence (et plus en bouton flottant
 * sur toutes les pages).
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Thème de l'interface"
      className="inline-flex items-center gap-1 rounded-xl p-1"
      style={{ background: "var(--hover-soft)", border: "1px solid var(--border-subtle)" }}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={
              active
                ? {
                    background: "var(--card-bg)",
                    color: "var(--text-primary)",
                    boxShadow: "var(--shadow-card)",
                  }
                : { color: "var(--text-muted)" }
            }
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggleRow() {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
        <Monitor size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Thème de l&apos;interface
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Choisis entre l&apos;apparence claire et sombre.
        </p>
      </div>
      <ThemeToggle />
    </div>
  );
}
