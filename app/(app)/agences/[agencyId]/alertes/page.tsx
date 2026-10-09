"use client";

import { useParams } from "next/navigation";
import DeadlineAlertsView from "@/app/(app)/components/deadline/DeadlineAlertsView";
import { useAppData } from "@/lib/appData";

export default function AgencyDeadlineAlertsPage() {
  const params = useParams<{ agencyId: string }>();
  const agencyId = String(params?.agencyId ?? "");

  const { agencyById } = useAppData();
  const agency = agencyById(agencyId);

  return (
    <DeadlineAlertsView agencyId={agencyId} subtitle={agency?.name ?? "Agence"} />
  );
}
