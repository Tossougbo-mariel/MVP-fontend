import type { Href } from "@/i18n/navigation";

type EntityId = string | number;

export const agencyDashboardHref = (agencyId: EntityId): Href => ({
  pathname: "/agences/[agencyId]/dashboard",
  params: { agencyId: String(agencyId) },
});
