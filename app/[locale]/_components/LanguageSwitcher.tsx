"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe, ChevronDown, Check } from "lucide-react";

const languageNames: Record<string, string> = {
  fr: "Français",
  en: "English",
};

type Locale = (typeof routing.locales)[number];

export default function LanguageSwitcher() {
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, routing.locales.indexOf(locale as Locale))
  );

  const close = () => {
    setOpen(false);
    setActiveIndex(Math.max(0, routing.locales.indexOf(locale as Locale)));
  };

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locale]);

  const switchLocale = (next: Locale) => {
    if (next !== locale) {
      router.replace(pathname, { locale: next });
    }
    close();
    buttonRef.current?.focus();
  };

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % routing.locales.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + routing.locales.length) % routing.locales.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      switchLocale(routing.locales[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("language")}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className="flex items-center gap-1.5 rounded-full border border-[#ffffff33] px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#ffffff1a]"
        style={{ transitionDuration: "0.25s" }}
      >
        <Globe size={15} />
        {locale.toUpperCase()}
        <ChevronDown
          size={14}
          className="transition-transform"
          style={{
            transitionDuration: "0.25s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          role="menu"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-[9000] mt-2 min-w-[160px] overflow-hidden rounded-lg border border-[#ffffff1a] bg-[#010e2e] py-1 shadow-[0_8px_32px_#00000066]"
        >
          {routing.locales.map((l, i) => (
            <button
              key={l}
              type="button"
              role="menuitem"
              aria-current={l === locale ? "true" : undefined}
              onClick={() => switchLocale(l)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-semibold transition-colors hover:bg-[#ffffff1a] ${
                l === locale ? "text-[color:var(--blue-light)]" : "text-white"
              }`}
              style={{ transitionDuration: "0.2s" }}
            >
              <Check
                size={14}
                className={l === locale ? "opacity-100" : "opacity-0"}
              />
              {languageNames[l] ?? l.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
