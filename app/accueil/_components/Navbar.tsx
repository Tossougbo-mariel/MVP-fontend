"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "#Accueil", label: "Accueil" },
  { href: "#features", label: "Fonctionnalités" },
  { href: "#how-it-works", label: "Comment ça marche" },
  { href: "#testimonials", label: "Témoignages" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [skinny, setSkinny] = useState(false);

  useEffect(() => {
    const onScroll = () => setSkinny(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 z-[9000] flex w-full items-center justify-between px-[60px] transition-all ${
          skinny ? "h-16 shadow-[0_4px_32px_#010b25cc]" : "h-[88px]"
        }`}
        style={{
          background: skinny ? "#010e2e" : "transparent",
          transitionDuration: "0.25s",
          transitionTimingFunction: "cubic-bezier(.4, 0, .2, 1)",
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[22px] font-extrabold tracking-[-0.5px] text-white whitespace-nowrap">
            MVP{" "}
            <span style={{ color: "#9dc7ff" }}>Manager</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex items-center rounded-lg px-3 py-2 text-[15px] font-semibold text-[#ffffffe0] transition-all hover:bg-[#ffffff1a]"
              style={{ transitionDuration: "0.25s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#9dc7ff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffffe0")}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/inscription"
            className="rounded-[100px] bg-[#056cf2] px-5 py-2.5 text-[15px] font-bold text-white transition-all hover:brightness-110"
            style={{ transitionDuration: "0.25s" }}
          >
            S&apos;inscrire
          </Link>
          <Link
            href="/connexion"
            className="rounded-lg px-4 py-2 text-[15px] font-semibold text-[#ffffffe0] transition-all hover:bg-[#ffffff1a]"
            style={{ transitionDuration: "0.25s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#9dc7ff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffffe0")}
          >
            Se connecter
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-[#ffffff1a] md:hidden"
          style={{ transitionDuration: "0.25s" }}
          aria-label="Ouvrir le menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-[8800] bg-white transition-transform md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          transitionDuration: "0.3s",
          transitionTimingFunction: "ease",
          padding: "100px 32px 40px",
          overflowY: "auto",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="border-b border-[#dfe5ed] py-3 text-[18px] font-bold text-[#0b1521] transition-colors hover:text-[#056cf2]"
          >
            {link.label}
          </a>
        ))}
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/inscription"
            onClick={() => setOpen(false)}
            className="rounded-[100px] bg-[#056cf2] px-6 py-3 text-center text-[14px] font-bold text-white"
          >
            S&apos;inscrire
          </Link>
          <Link
            href="/connexion"
            onClick={() => setOpen(false)}
            className="rounded-[100px] border border-[#dfe5ed] px-6 py-3 text-center text-[14px] font-bold text-[#0b1521]"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </>
  );
}
