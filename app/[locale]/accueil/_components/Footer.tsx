"use client";

import { Link } from "@/i18n/navigation";
import { Reveal } from "./Reveal";
import LanguageSwitcher from "@/app/lib/LanguageSwitcher";

const productLinks = [
  { href: "#features", label: "Fonctionnalités" },
  { href: "#how-it-works", label: "Comment ça marche" },
  { href: "#testimonials", label: "Témoignages" },
];

const accountLinks = [
  { href: "/connexion", label: "Se connecter" },
  { href: "/inscription", label: "Créer un compte" },
  { href: "/mot-de-passe-oublie", label: "Mot de passe oublié" },
];

export default function Footer() {
  return (
    <footer className="py-16 px-4" style={{ background: "#000a1e" }}>
      <Reveal className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              MVP{" "}
              <span style={{ color: "var(--blue-light)" }}>Studio</span>
            </span>
            <p className="mt-4 max-w-xs text-sm font-medium leading-6" style={{ color: "#ffffff99" }}>
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
                    className="text-sm font-medium text-[#ffffffB3] transition-colors duration-200 hover:text-[color:var(--blue-light)]"
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
                    className="text-sm font-medium text-[#ffffffB3] transition-colors duration-200 hover:text-[color:var(--blue-light)]"
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
<LanguageSwitcher />
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row" style={{ borderColor: "#ffffff1a" }}>
          <p className="text-sm font-medium" style={{ color: "#ffffff99" }}>
            &copy; {new Date().getFullYear()} MVP Studio. Tous droits réservés.
          </p>
        
        </div>
      </Reveal>
    </footer>
  );
}
