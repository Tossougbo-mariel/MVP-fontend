"use client";

import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDateShort } from "./dates";
import { parseNotificationContent } from "./notificationContent";
import type { AppNotification, Project } from "./types";

export type NotificationContent = {
  title: string | null;
  message: string | null;
};

const formatNotificationDate = (iso: string | undefined, locale: string): string | undefined => {
  if (!iso) return undefined;

  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;

  return formatDateShort(date, locale);
};

export function useNotificationContent() {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const translate = t as unknown as (key: string, values?: Record<string, string | number>) => string;

  return useCallback(
    (notification: AppNotification, projects?: Project[]): NotificationContent => {
      const parsed = parseNotificationContent(notification);
      if (!parsed) {
        return { title: notification.title || null, message: notification.message };
      }

      const projectName =
        parsed.projectId != null
          ? projects?.find((project) => Number(project.id) === parsed.projectId)?.name
          : undefined;
      const hasProject = Boolean(projectName && parsed.messageKeyNoProject);
      const messageKey = hasProject
        ? parsed.messageKey
        : (parsed.messageKeyNoProject ?? parsed.messageKey);
      const params: Record<string, string | number> = { ...parsed.params };

      if (hasProject && projectName) params.project = projectName;

      const date = formatNotificationDate(parsed.date, locale);
      if (date) params.date = date;

      if (parsed.roleKey) params.role = translate(parsed.roleKey);

      if (parsed.actor) {
        const { name, roleKey, agency } = parsed.actor;

        if (!roleKey) {
          params.actor = name;
        } else {
          const role = translate(roleKey);
          params.actor = agency
            ? translate("actorWithRoleAndAgency", { name, role, agency })
            : translate("actorWithRole", { name, role });
        }
      }

      return { title: null, message: translate(messageKey, params) };
    },
    [locale, translate],
  );
}
