import { redirect, type Locale } from "@/i18n/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect({ href: "/accueil", locale });
}
