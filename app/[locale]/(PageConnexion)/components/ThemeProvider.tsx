"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

const ATTRIBUTE = "data-theme";

const readDomTheme = (): Theme =>
  document.documentElement.getAttribute(ATTRIBUTE) === "light" ? "light" : "dark";

/**
 * Le thème vit dans l'attribut `data-theme` du <html> : c'est la même
 * valeur que celle lue par le CSS et écrite par le script inline de
 * `app/layout.tsx`.
 *
 * On s'y abonne donc directement (useSyncExternalStore) au lieu de
 * recopier la valeur dans un état React, ce qui évite de désynchroniser
 * les deux et de lors du rendu côté serveur le snapshot serveur évite
 * tout écart d'hydratation.
 */
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [ATTRIBUTE],
  });

  // Un autre onglet peut changer le thème : on suit aussi le storage.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}

const getServerTheme = (): Theme => "dark";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useSyncExternalStore(subscribeToTheme, readDomTheme, getServerTheme);

  const setTheme = useCallback((next: Theme) => {
    const apply = () => {
      document.documentElement.setAttribute(ATTRIBUTE, next);
      localStorage.setItem(STORAGE_KEY, next);
    };

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };

    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(readDomTheme() === "light" ? "dark" : "light"),
    [setTheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
