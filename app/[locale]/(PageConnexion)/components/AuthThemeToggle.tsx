"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "./ThemeProvider";

export default function AuthThemeToggle() {
  const t = useTranslations("Settings.theme");
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `${t("label")}: ${t(nextTheme)}`;
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="absolute top-5 right-4 lg:right-6 z-20 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:opacity-80"
      style={{
        color: "var(--text-primary)",
        background: "var(--hover-soft)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
