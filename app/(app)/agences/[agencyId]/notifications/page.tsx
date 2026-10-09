"use client";

import { useParams } from "next/navigation";
import NotificationsView from "@/app/(app)/components/notifications/NotificationsView";
import { useAppData } from "@/lib/appData";

export default function AgencyNotificationsPage() {
  const params = useParams<{ agencyId: string }>();
  const agencyId = String(params?.agencyId ?? "");

  const { data, agencyById } = useAppData();
  const agency = agencyById(agencyId);

  return (
    <NotificationsView
      notifications={data.notifications}
      loading={data.loading}
      agencyId={agencyId}
      subtitle={agency?.name ?? "Agence"}
      emptyMessage="Aucune notification pour cette agence."
    />
  );
}
