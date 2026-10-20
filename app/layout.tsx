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
            // Ce script évite le flash au rechargement : il applique, avant la
            // première peinture, la valeur en cache (localStorage) du thème
            // clair/sombre ET de la couleur d'accent. Sans la seconde partie,
            // l'apparaitrait en bleu par défaut le temps que AccentApplier
            // s'exécute après hydratation.
            //
            // L'accent n'est restauré que sur les écrans de l'app : la page
            // d'accueil garde l'identité bleue de la marque (AccentResetter)
            // et les pages de connexion forcent l'apparence par défaut
            // (ForceDefaultAppearance dans app/(PageConnexion)/layout.tsx).
            //
            // Miroir de lib/applyAccent.ts (buildAccentRamp) : hex valide,
            // mélanges avec le blanc à 12/35/68 %, triplets RGB. Le bleu par
            // défaut (#056cf2) est ignoré, le CSS de :root le porte déjà.
            __html: `(function(){var d=document.documentElement;try{var t=localStorage.getItem("theme");d.setAttribute("data-theme",t==="dark"||t==="light"?t:"dark")}catch(e){d.setAttribute("data-theme","dark")}try{var p=location.pathname;if(p==="/"||p==="/accueil"||/^\\/(connexion|inscription|mot-de-passe-oublie|reinitialiser-mot-de-passe|accepter-invitation)(\\/|$)/.test(p))return;var a=localStorage.getItem("mvp-accent");if(!a||!/^#[0-9a-fA-F]{6}$/.test(a))return;a=a.toLowerCase();if(a==="#056cf2")return;var c=[parseInt(a.substr(1,2),16),parseInt(a.substr(3,2),16),parseInt(a.substr(5,2),16)];var ch=function(n){var h=Math.round(n).toString(16);return h.length<2?"0"+h:h};var mix=function(t){return [c[0]+(255-c[0])*t,c[1]+(255-c[1])*t,c[2]+(255-c[2])*t]};var hx=function(m){return "#"+ch(m[0])+ch(m[1])+ch(m[2])};var rgb=function(m){return Math.round(m[0])+", "+Math.round(m[1])+", "+Math.round(m[2])};var accent=mix(0.12),mid=mix(0.35),light=mix(0.68);d.style.setProperty("--blue",a);d.style.setProperty("--blue-accent",hx(accent));d.style.setProperty("--blue-mid",hx(mid));d.style.setProperty("--blue-light",hx(light));d.style.setProperty("--blue-rgb",rgb(c));d.style.setProperty("--blue-mid-rgb",rgb(mid));d.style.setProperty("--blue-light-rgb",rgb(light))}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
