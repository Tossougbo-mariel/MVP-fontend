"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";

export default function Footer() {
  const t = useTranslations("Landing.footer");
  const tn = useTranslations("Navigation");

  const productLinks = [
    { href: "#features", label: tn("features") },
    { href: "#how-it-works", label: tn("howItWorks") },
    { href: "#testimonials", label: tn("testimonials") },
  ];

  const accountLinks = [
    { href: "/connexion", label: tn("login") },
    { href: "/inscription", label: t("createAccount") },
    { href: "/mot-de-passe-oublie", label: t("forgotPassword") },
  ];

  return (
    <footer className="py-16 px-4" style={{ background: "#000a1e" }}>
      <Reveal className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              MVP{" "}
              <span style={{ color: "var(--blue-light)" }}>Studio</span>
            </span>
            <p className="mt-4 max-w-xs text-sm font-medium leading-6" style={{ color: "#ffffff99" }}>
              {t("description")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              {t("productTitle")}
            </h3>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
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
              {t("accountTitle")}
            </h3>
            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
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
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row" style={{ borderColor: "#ffffff1a" }}>
          <p className="text-sm font-medium" style={{ color: "#ffffff99" }}>
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </Reveal>
    </footer>
  );
}