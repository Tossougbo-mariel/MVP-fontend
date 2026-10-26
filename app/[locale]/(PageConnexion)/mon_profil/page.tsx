import { hasLocale } from "next-intl";
import { getLocale } from "next-intl/server";
import { permanentRedirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default async function LegacyProfilePage() {
  const requested = await getLocale();
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  permanentRedirect({ href: "/profil", locale });
}
