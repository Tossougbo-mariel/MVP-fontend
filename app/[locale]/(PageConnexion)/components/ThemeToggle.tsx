"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme, type Theme } from "./ThemeProvider";

const OPTIONS: { value: Theme; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
];

/**
 * Sélecteur de thème clair / sombre.
 *
 * Habité dans la page Paramètres de l'agence (et plus en bouton flottant
 * sur toutes les pages).
 */
export default function ThemeToggle({ onChange }: { onChange?: (theme: Theme) => void } = {}) {
  const t = useTranslations("Settings.theme");
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="inline-flex items-center gap-1 rounded-xl p-1"
      style={{ background: "var(--hover-soft)", border: "1px solid var(--border-subtle)" }}
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              setTheme(value);
              onChange?.(value);
            }}
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
            {t(value === "light" ? "light" : "dark")}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggleRow() {
  const t = useTranslations("Settings.theme");
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
        <Monitor size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("label")}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t("description")}
        </p>
      </div>
      <ThemeToggle />
    </div>
  );
}
