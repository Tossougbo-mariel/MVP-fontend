"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";
import { Bell, Palette, Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { fetchNotificationPreferences, updateNotificationPreferences, getApiErrorMessage } from "@/lib/services";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/types";
import { DEFAULT_ACCENT, PRESET_COLORS, toAccentHex } from "@/lib/accentTheme";
import { applyAccent, storeAccent } from "@/lib/applyAccent";
import ThemeToggle from "@/app/[locale]/(PageConnexion)/components/ThemeToggle";
import Select from "@/app/[locale]/(app)/components/Select";
import { useLocaleSwitch } from "@/app/lib/LanguageSwitcher";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { y: 18, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

/**
 * Réglages de la plateforme : ce qui vaut pour toutes les agences, contrairement
 * aux réglages d'agence qui vivent dans le second sidebar (cf. AgencyPanel).
 * Le profil reste centré sur l'identité ; cette page porte les préférences.
 */
export default function ReglagesPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const locale = useLocale();
  const t = useTranslations("Settings");
  const switchLocale = useLocaleSwitch();
  const [showThemes, setShowThemes] = useState(false);
  const [accentError, setAccentError] = useState<string | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notifPrefsError, setNotifPrefsError] = useState<string | null>(null);
  const [notifBusy, setNotifBusy] = useState(false);

  const userAccent = toAccentHex(user?.themeColor);

  // Un seul interrupteur pilote les six préférences à la fois : il est « actif »
  // seulement si aucune n'est désactivée, sinon un clic les rallume toutes.
  const notifKeys = Object.keys(notifPrefs) as (keyof NotificationPreferences)[];
  const allNotifOn = notifKeys.every((key) => notifPrefs[key]);

  useEffect(() => {
    document.title = t("title");
  }, [t]);

  useEffect(() => {
    let active = true;
    fetchNotificationPreferences()
      .then((prefs) => {
        if (active) setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs });
      })
      .catch(() => {
        if (active) setNotifPrefsError(t("notifications.loadError"));
      });
    return () => {
      active = false;
    };
  }, [t]);

  const handleAccentSelect = async (hex: string) => {
    if (!user) return;
    if (hex.toLowerCase() === userAccent.toLowerCase()) return;
    applyAccent(hex);
    // Conservé hors session : c'est ce qui permet de retrouver cette couleur
    // sur les pages de connexion et d'inscription, puis après une déconnexion.
    storeAccent(hex);
    setAccentError(null);
    try {
      await updateUser({ themeColor: hex });
    } catch {
      setAccentError(t("theme.saveError"));
    }
  };

  // L'apparence clair/sombre suit le compte (colonne users.theme), comme la
  // couleur d'accent : elle se retrouve sur tous les appareils.
  const handleThemeChange = async (theme: "light" | "dark") => {
    setThemeError(null);
    try {
      await updateUser({ theme });
    } catch {
      setThemeError(t("appearance.saveError"));
    }
  };

  const toggleAllNotifPrefs = async () => {
    const previous = notifPrefs;
    const next = !allNotifOn;
    const payload = Object.fromEntries(notifKeys.map((key) => [key, next])) as NotificationPreferences;
    setNotifPrefs(payload);
    setNotifPrefsError(null);
    setNotifBusy(true);
    try {
      const saved = await updateNotificationPreferences(payload);
      setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...saved });
    } catch (err) {
      setNotifPrefs(previous);
      setNotifPrefsError(getApiErrorMessage(err));
    } finally {
      setNotifBusy(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl lg:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {t("subtitle")}
        </p>
      </motion.div>

      {/* ---------- Préférences ---------- */}
      <motion.section variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: "var(--text-primary)" }}>
          <SlidersHorizontal size={18} style={{ color: "var(--accent-text)" }} /> {t("preferences.title")}
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          {t("preferences.description")}
        </p>

        <div className="space-y-6">
          <div className="max-w-sm">
            <label className="text-xs uppercase tracking-wide block mb-1" style={{ color: "var(--text-secondary)" }}>
              {t("language.label")}
            </label>
            <Select
              value={locale}
              onChange={(value) => switchLocale(value as "fr" | "en")}
              options={[
                { value: "fr", label: t("language.french") },
                { value: "en", label: t("language.english") },
              ]}
              className="w-full"
              ariaLabel={t("language.label")}
            />
          </div>

          {/* Un seul interrupteur pour toutes les notifications : il coupe ou
              rallume d'un coup les six catégories. */}
          <div
            className="px-4 py-3 rounded-xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <button
              type="button"
              onClick={toggleAllNotifPrefs}
              disabled={notifBusy}
              aria-pressed={allNotifOn}
              className="w-full flex items-center justify-between gap-4 text-left transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Bell size={15} style={{ color: "var(--text-secondary)" }} />
                <span className="min-w-0">
                  <span className="block text-sm" style={{ color: "var(--text-primary)" }}>
                    {t("notifications.title")}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {t("notifications.description")}
                  </span>
                </span>
              </span>
              <span
                className="w-10 h-6 rounded-full relative transition-colors shrink-0"
                style={{ background: allNotifOn ? "var(--gradient-button)" : "var(--border-subtle)" }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: allNotifOn ? "19px" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                />
              </span>
            </button>

            {notifPrefsError && (
              <p className="text-xs font-semibold mt-2" style={{ color: "var(--color-error)" }}>
                {notifPrefsError}
              </p>
            )}
          </div>

          {/* Thème : la couleur d'accent, repliée derrière un bouton comme sur
              l'ancien écran Profil. */}
          <div className="px-5 py-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setShowThemes((s) => !s)}
              aria-expanded={showThemes}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Palette size={15} style={{ color: "var(--text-secondary)" }} /> {t("theme.title")}
              </span>
              <ChevronDown
                size={16}
                style={{ color: "var(--text-secondary)", transform: showThemes ? "rotate(180deg)" : "none" }}
              />
            </button>

            {showThemes && (
              <>
                <div className="mt-3 grid grid-cols-6 gap-x-1.5 gap-y-2">
                  {[{ key: "default", hex: DEFAULT_ACCENT }, ...PRESET_COLORS].map((preset) => {
                    const active = userAccent.toLowerCase() === preset.hex.toLowerCase();
                    const label = t(`colors.${preset.key}`);
                    return (
                      <button
                        key={preset.key}
                        onClick={() => handleAccentSelect(preset.hex)}
                        title={label}
                        aria-label={t("theme.accentColor", { name: label })}
                        className="h-9 w-9 justify-self-center rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{
                          background: preset.hex,
                          border: active ? "2px solid var(--accent-text)" : "2px solid transparent",
                          boxShadow: active ? "0 0 0 2px var(--surface), 0 0 0 4px var(--accent-text)" : "none",
                        }}
                      >
                        {active && <Check size={13} style={{ color: "#fff", strokeWidth: 3 }} />}
                      </button>
                    );
                  })}
                </div>
                <label
                  className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer"
                  style={{ background: "var(--hover-soft)", border: "1px solid var(--border-subtle)" }}
                >
                  <span className="text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Palette size={15} style={{ color: "var(--text-secondary)" }} /> {t("theme.custom")}
                  </span>
                  <input
                    type="color"
                    value={userAccent}
                    onChange={(e) => handleAccentSelect(e.target.value)}
                    aria-label={t("theme.custom")}
                    className="ml-auto h-9 w-12 cursor-pointer rounded-lg border-none bg-transparent p-0"
                  />
                </label>

                {accentError && (
                  <p className="text-xs font-semibold mt-2" style={{ color: "var(--color-error)" }}>
                    {accentError}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* ---------- Apparence ---------- */}
      <motion.section variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: "var(--text-primary)" }}>
          <Palette size={18} style={{ color: "var(--accent-text)" }} /> {t("appearance.title")}
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          {t("appearance.description")}
        </p>

        <div className="space-y-4">
          <div
            className="w-full flex flex-wrap items-center justify-between gap-4 px-5 py-4 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <ThemeToggle onChange={handleThemeChange} />
          </div>
          {themeError && (
            <p className="text-xs" style={{ color: "var(--color-error)" }}>
              {themeError}
            </p>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}