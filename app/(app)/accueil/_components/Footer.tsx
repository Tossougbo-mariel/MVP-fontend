"use client";

import { Fragment, useState } from "react";
import Link from "next/link";

const productLinks = [
  { href: "#features", label: "Fonctionnalités" },
  { href: "#how-it-works", label: "Comment ça marche" },
  { href: "#testimonials", label: "Témoignages" },
];

const accountLinks = [
  { href: "/PageConnexion/connexion", label: "Se connecter" },
  { href: "/PageConnexion/inscription", label: "Créer un compte" },
  { href: "/PageConnexion/mot-de-passe-oublie", label: "Mot de passe oublié" },
];

export default function Footer() {
  const [lang, setLang] = useState<"FR" | "EN">("FR");

  return (
    <footer className="py-16 px-4" style={{ background: "#000a1e" }}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              MVP{" "}
              <span style={{ color: "#9dc7ff" }}>Manager</span>
            </span>
            <p className="mt-4 max-w-xs text-sm leading-6" style={{ color: "#ffffff66" }}>
              La plateforme tout-en-un pour gérer vos agences, vos projets et
              vos équipes, simplement et efficacement.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Produit
            </h3>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#ffffff99] transition-colors duration-200 hover:text-[#9dc7ff]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Compte
            </h3>
            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#ffffff99] transition-colors duration-200 hover:text-[#9dc7ff]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Langue
            </h3>
<div className="mt-4 flex items-center gap-2">
              {(["FR", "EN"] as const).map((l, i) => (
                <Fragment key={l}>
                  {i > 0 && (
                    <span className="text-sm" style={{ color: "#ffffff66" }}>
                      |
                    </span>
                  )}
                  <button
                    onClick={() => setLang(l)}
                    className={`text-sm transition-colors duration-200 ${
                      lang === l ? "text-[#9dc7ff]" : "text-[#ffffff99] hover:text-[#9dc7ff]"
                    }`}
                  >
                    {l}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row" style={{ borderColor: "#ffffff1a" }}>
          <p className="text-sm" style={{ color: "#ffffff66" }}>
            &copy; {new Date().getFullYear()} MVP Manager. Tous droits réservés.
          </p>
        
        </div>
      </div>
    </footer>
  );
}
