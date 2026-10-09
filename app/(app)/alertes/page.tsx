"use client";

import DeadlineAlertsView from "@/app/(app)/components/deadline/DeadlineAlertsView";
import { useAuthStore } from "@/app/store/authStore";

export default function DeadlineAlertsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <DeadlineAlertsView
      subtitle={user ? `${user.firstName}, voici vos tâches à surveiller` : undefined}
    />
  );
}
