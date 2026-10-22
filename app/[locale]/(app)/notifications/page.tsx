"use client";

import { useTranslations } from "next-intl";
import NotificationsView from "@/app/[locale]/(app)/components/notifications/NotificationsView";
import { useAppData } from "@/lib/appData";
import { useAuthStore } from "@/app/store/authStore";

export default function NotificationsPage() {
  const { data } = useAppData();
  const user = useAuthStore((s) => s.user);
  const t = useTranslations("NotificationsPage");

  return (
    <NotificationsView
      notifications={data.notifications}
      loading={data.loading}
      subtitle={user ? t("subtitle", { firstName: user.firstName }) : undefined}
      emptyMessage={user ? t("emptyForUser", { firstName: user.firstName }) : t("emptyDefault")}
    />
  );
}
