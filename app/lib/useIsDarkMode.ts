"use client";

import { useEffect, useState } from "react";

// ✅ Détecte le thème actif (clair / sombre) en observant l'attribut
// data-theme posé sur <html>. Se met à jour en temps réel lors du changement.
export const useIsDarkMode = () => {
  const [dark, setDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-theme") === "dark"
      : true,
  );

  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.getAttribute("data-theme") === "dark");
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return dark;
};