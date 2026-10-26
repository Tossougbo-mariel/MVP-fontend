"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import NotificationsView from "@/app/[locale]/(app)/components/notifications/NotificationsView";
import { useAppData } from "@/lib/appData";

export default function AgencyNotificationsPage() {
  const params = useParams<{ agencyId: string }>();
  const agencyId = String(params?.agencyId ?? "");
  const t = useTranslations("Notifications");
  const tnav = useTranslations("Navigation");

  const { data, agencyById } = useAppData();
  const agency = agencyById(agencyId);

  return (
    <NotificationsView
      notifications={data.notifications}
      loading={data.loading}
      agencyId={agencyId}
      subtitle={agency?.name ?? tnav("app.agency")}
      emptyMessage={t("emptyAgency")}
    />
  );
}
