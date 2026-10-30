import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import ThemeProvider from "./(PageConnexion)/components/ThemeProvider";
import "./globals.css";


// Police hébergée dans le projet (app/fonts) : elle s'affiche même sans
// connexion, contrairement à next/font/google qui la télécharge au démarrage.
const manrope = localFont({
  src: "../fonts/Manrope-Variable.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

type LocaleParams = { locale: string };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${manrope.variable} h-full antialiased`}
      data-theme="dark"
      // Indispensable avec `scroll-behavior: smooth` dans globals.css : sans
      // cet attribut, Next ne peut pas supprimer le défilement lisse pendant
      // une transition de route et affiche un avertissement a chaque clic.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
     
      <body className="min-h-full flex flex-col">
      {/* Scripts anti-FOUC : rendus en ligne, et non via `next/script`.
          `next/script` sérialise le script dans le payload RSC : le navigateur
          ne l'exécute qu'après l'hydratation, donc trop tard — le flash de
          couleur (bleu par défaut) restait visible. En <script> inline, le
          code s'exécute pendant l'analyse du HTML, donc avant le premier
          rendu. */}
      <script
        id="theme-init"
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var p=localStorage.getItem("theme-pending-sync"),t=(p==="dark"||p==="light")?p:localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}else{document.documentElement.setAttribute("data-theme","dark")}}catch(e){document.documentElement.setAttribute("data-theme","dark")}})()`,
        }}
      />
      <script
        id="accent-init"
        dangerouslySetInnerHTML={{
          // Anti-FOUC : la couleur d'accent doit être posée AVANT le premier
          // rendu. Sans ce script, l'application s'affiche d'abord en bleu par
          // défaut (--blue) puis change de couleur après l'hydratation, quand
          // AccentApplier reprend la couleur du compte : c'est le « flash bleu »
          // visible à chaque chargement.
          //
          // La rampe est recalculée ici (mélange avec le blanc) ; la source de
          // vérité reste lib/color.ts (buildAccentRamp).
          //
          // Deux sources sont lues, dans cet ordre : la copie locale
          // `mvp-accent`, puis la session persistée (`mvp-auth`), qui contient
          // elle aussi la couleur du compte. Sans ce second recours, un
          // navigateur dont la copie locale a été effacée afficherait le bleu
          // par défaut jusqu'à la réponse de l'API.
          __html: `(function(){try{
var seg=(location.pathname||"").split("/").filter(Boolean);
if(seg[0]==="fr"||seg[0]==="en")seg.shift();
var rest="/"+seg.join("/");
if(rest==="/"||rest==="/accueil"||rest.indexOf("/accueil/")===0)return;
var pub=["connexion","inscription","mot-de-passe-oublie","reinitialiser-mot-de-passe","accepter-invitation"];
for(var i=0;i<pub.length;i++){if(rest==="/"+pub[i]||rest.indexOf("/"+pub[i]+"/")===0)return;}
var h=(localStorage.getItem("mvp-accent")||"").trim().toLowerCase();
if(!h){try{var s=JSON.parse(localStorage.getItem("mvp-auth")||"{}");h=String((s&&s.state&&s.state.user&&s.state.user.themeColor)||"").trim().toLowerCase();}catch(e){}}
if(!h)return;
if(/^#[0-9a-f]{3}$/.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
if(!/^#[0-9a-f]{6}$/.test(h)||h==="#056cf2")return;
var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
function mix(a){return "#"+[r,g,b].map(function(c){var m=Math.round(c+(255-c)*a).toString(16);return m.length<2?"0"+m:m;}).join("");}
function trip(x){return parseInt(x.slice(1,3),16)+", "+parseInt(x.slice(3,5),16)+", "+parseInt(x.slice(5,7),16);}
var mid=mix(0.35),light=mix(0.68),s=document.documentElement.style;
s.setProperty("--blue",h);
s.setProperty("--blue-accent",mix(0.12));
s.setProperty("--blue-mid",mid);
s.setProperty("--blue-light",light);
s.setProperty("--blue-rgb",r+", "+g+", "+b);
s.setProperty("--blue-mid-rgb",trip(mid));
s.setProperty("--blue-light-rgb",trip(light));
}catch(e){}})()`,
        }}
      />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}