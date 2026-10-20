import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, Geist_Mono } from "next/font/google";
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

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="dark"
      // Indispensable avec `scroll-behavior: smooth` dans globals.css : sans
      // cet attribut, Next ne peut pas supprimer le défilement lisse pendant
      // une transition de route et affiche un avertissement a chaque clic.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
     
      <body className="min-h-full flex flex-col">
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}else{document.documentElement.setAttribute("data-theme","dark")}}catch(e){document.documentElement.setAttribute("data-theme","dark")}})()`,
        }}
      />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
