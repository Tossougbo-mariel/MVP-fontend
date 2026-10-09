"use client";

import NotificationsView from "@/app/(app)/components/notifications/NotificationsView";
import { useAppData } from "@/lib/appData";
import { useAuthStore } from "@/app/store/authStore";

export default function NotificationsPage() {
  const { data } = useAppData();
  const user = useAuthStore((s) => s.user);

  return (
    <NotificationsView
      notifications={data.notifications}
      loading={data.loading}
      subtitle={user ? `${user.firstName}, voici vos dernières alertes` : undefined}
      emptyMessage={
        user ? `Aucune notification pour le moment, ${user.firstName}.` : "Aucune notification."
      }
    />
  );
}
