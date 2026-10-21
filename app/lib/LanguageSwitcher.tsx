"use client";

import { Fragment } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

/**
 * Change la langue courante en conservant la page visitée. Le hook est partagé
 * par le sélecteur inline (pied de page) et les Réglages.
 */
export function useLocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (next: Locale) => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };
}

type LanguageSwitcherProps = {
  labels?: Partial<Record<string, string>>;
  activeClassName?: string;
  inactiveClassName?: string;
  separatorClassName?: string;
  className?: string;
};

export default function LanguageSwitcher({
  labels,
  activeClassName = "text-[color:var(--blue-light)]",
  inactiveClassName = "text-[#ffffff99] hover:text-[color:var(--blue-light)]",
  separatorClassName = "text-sm",
  className = "mt-4 flex items-center gap-2",
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const switchLocale = useLocaleSwitch();

  return (
    <div className={className}>
      {routing.locales.map((l, i) => (
        <Fragment key={l}>
          {i > 0 && (
            <span className={separatorClassName} style={{ color: "#ffffff66" }}>
              |
            </span>
          )}
          <button
            type="button"
            onClick={() => switchLocale(l)}
            aria-pressed={locale === l}
            className={`text-sm transition-colors duration-200 ${
              locale === l ? activeClassName : inactiveClassName
            }`}
          >
            {labels?.[l] ?? l.toUpperCase()}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
