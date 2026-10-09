import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import ThemeProvider from "./(PageConnexion)/components/ThemeProvider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "MVP Studio — Gestion de tâches",
  description:
    "Plateforme de gestion et de suivi des tâches pour équipes, freelances et agences.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="dark"
      // Indispensable avec `scroll-behavior: smooth` dans globals.css : sans
      // cet attribut, Next ne peut pas supprimer le défilement lisse pendant
      // une transition de route et affiche un avertissement a chaque clic.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            // Le fond (clair/sombre) suit le thème choisi partout, y compris
            // sur les pages de connexion : seul l'accent bleu y est forcé
            // (voir app/(PageConnexion)/layout.tsx).
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}else{document.documentElement.setAttribute("data-theme","dark")}}catch(e){document.documentElement.setAttribute("data-theme","dark")}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
