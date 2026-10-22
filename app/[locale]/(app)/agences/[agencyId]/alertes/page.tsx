"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import DeadlineAlertsView from "@/app/[locale]/(app)/components/deadline/DeadlineAlertsView";
import { useAppData } from "@/lib/appData";

export default function AgencyDeadlineAlertsPage() {
  const params = useParams<{ agencyId: string }>();
  const agencyId = String(params?.agencyId ?? "");
  const t = useTranslations("Navigation");

  const { agencyById } = useAppData();
  const agency = agencyById(agencyId);

  return (
    <DeadlineAlertsView agencyId={agencyId} subtitle={agency?.name ?? t("app.agency")} />
  );
}
