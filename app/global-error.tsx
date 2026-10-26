"use client";

import { useEffect, useState } from "react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw } from "lucide-react";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";
import "./[locale]/globals.css";

type Locale = "fr" | "en";

function GlobalErrorContent({ retry }: { retry: () => void }) {
  const t = useTranslations("Errors");
  const tc = useTranslations("Common");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: "color-mix(in srgb, var(--color-error) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-error) 30%, transparent)",
          color: "var(--color-error)",
        }}
      >
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div>
        <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
          {t("globalErrorTitle")}
        </h1>
        <p className="mt-2 max-w-md" style={{ color: "var(--text-secondary)" }}>
          {t("globalErrorDescription")}
        </p>
      </div>

      <button
        type="button"
        onClick={() => retry()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
        style={{ background: "var(--gradient-button)" }}
      >
        <RotateCcw size={16} /> {tc("retry")}
      </button>
    </main>
  );
}

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [locale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "fr";
    const segment = window.location.pathname.split("/").filter(Boolean)[0];
    return segment === "en" ? "en" : "fr";
  });

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale} data-theme="dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider
          locale={locale}
          messages={locale === "en" ? enMessages : frMessages}
        >
          <GlobalErrorContent retry={retry} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
