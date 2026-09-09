"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Changer de thème"
      title="Changer de thème"
      className="fixed top-5 right-5 z-50 flex items-center justify-center w-11 h-11 rounded-full transition-transform duration-300 hover:scale-110"
      style={{
        background: "var(--card-bg)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <Sun size={20} className="icon-theme-sun" />
      <Moon size={20} className="icon-theme-moon" />
    </button>
  );
}