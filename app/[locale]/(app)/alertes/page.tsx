"use client";

import { useTranslations } from "next-intl";
import DeadlineAlertsView from "@/app/[locale]/(app)/components/deadline/DeadlineAlertsView";
import { useAuthStore } from "@/app/store/authStore";

export default function DeadlineAlertsPage() {
  const user = useAuthStore((s) => s.user);
  const t = useTranslations("Deadlines");

  return (
    <DeadlineAlertsView
      subtitle={user ? t("pageSubtitle", { firstName: user.firstName }) : undefined}
    />
  );
}
