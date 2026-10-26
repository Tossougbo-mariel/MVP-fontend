import { parseInvitationText } from "./notifications";
import type { AppNotification } from "./types";

export type NotificationActor = {
  name: string;
  roleKey?: "actorRoleOwner" | "actorRoleAdmin" | "actorRoleMember";
  agency?: string;
};

export type ParsedNotificationContent = {
  messageKey: string;
  messageKeyNoProject?: string;
  params: Record<string, string | number>;
  projectId: number | null;
  actor?: NotificationActor;
  roleKey?: "roleAdmin" | "roleMember";
  date?: string;
};

const PROJECT_ID = /\/projets\/(\d+)(?:\/|$)/;
const ROLE_KEYS: Record<string, NotificationActor["roleKey"]> = {
  "propriétaire": "actorRoleOwner",
  proprietaire: "actorRoleOwner",
  admin: "actorRoleAdmin",
  membre: "actorRoleMember",
};

export const notificationProjectId = (n: AppNotification): number | null => {
  const match = n.link?.match(PROJECT_ID);
  return match ? Number(match[1]) : null;
};

const parseActorContext = (raw: string): NotificationActor => {
  const text = raw.trim();
  const match = text.match(
    /^(.*?)\s*\((propriétaire|proprietaire|admin|membre)\)(?:\s+de l['’]agence\s*[«"](.+?)[»"])?$/i,
  );

  if (!match) return { name: text };

  const role = match[2].toLowerCase();

  return {
    name: match[1].trim(),
    roleKey: ROLE_KEYS[role],
    agency: match[3]?.trim() || undefined,
  };
};

const toISODate = (raw: string): string | undefined => {
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : undefined;
};

const parseTaskAssigned = (message: string, projectId: number | null): ParsedNotificationContent | null => {
  const match = message.match(/^(.+?) vous a assigné à « (.+?) »\.?$/i);
  if (!match) return null;

  return {
    messageKey: "taskAssignedBody",
    messageKeyNoProject: "taskAssignedBodyNoProject",
    params: { task: match[2] },
    projectId,
    actor: parseActorContext(match[1]),
  };
};

const parseTaskRemoved = (message: string, projectId: number | null): ParsedNotificationContent | null => {
  const match = message.match(/^(.+?) vous a retiré de « (.+?) »\.?$/i);
  if (!match) return null;

  return {
    messageKey: "taskRemovedBody",
    messageKeyNoProject: "taskRemovedBodyNoProject",
    params: { task: match[2] },
    projectId,
    actor: parseActorContext(match[1]),
  };
};

const parseTaskDone = (message: string, projectId: number | null): ParsedNotificationContent | null => {
  const match = message.match(/^(.+?) a marqué « (.+?) » comme terminée\.?$/i);
  if (!match) return null;

  return {
    messageKey: "taskDoneBody",
    messageKeyNoProject: "taskDoneBodyNoProject",
    params: { task: match[2] },
    projectId,
    actor: parseActorContext(match[1]),
  };
};

const parseTaskReopened = (message: string, projectId: number | null): ParsedNotificationContent | null => {
  const match = message.match(
    /^La tâche « (.+?) » a été rouverte : son prérequis « (.+?) » n['’]est plus terminé\.?$/i,
  );
  if (!match) return null;

  return {
    messageKey: "taskReopenedBody",
    messageKeyNoProject: "taskReopenedBodyNoProject",
    params: { task: match[1], prereq: match[2] },
    projectId,
  };
};

const parseComment = (message: string, projectId: number | null): ParsedNotificationContent | null => {
  const match = message.match(/^(.+?) a commenté « (.+?) »(?: : « ([\s\S]*) »)?\.?$/i);
  if (!match) return null;

  const excerpt = match[3]?.trim();

  return {
    messageKey: excerpt ? "commentBodyWithExcerpt" : "commentBody",
    messageKeyNoProject: excerpt ? "commentBodyNoProjectWithExcerpt" : "commentBodyNoProject",
    params: { author: match[1], task: match[2], ...(excerpt ? { excerpt } : {}) },
    projectId,
  };
};

const parseMention = (message: string, projectId: number | null): ParsedNotificationContent | null => {
  const match = message.match(/^(.+?) vous a mentionné sur « (.+?) »(?: : « ([\s\S]*) »)?\.?$/i);
  if (!match) return null;

  const excerpt = match[3]?.trim();

  return {
    messageKey: excerpt ? "mentionBodyWithExcerpt" : "mentionBody",
    messageKeyNoProject: excerpt ? "mentionBodyNoProjectWithExcerpt" : "mentionBodyNoProject",
    params: { author: match[1], task: match[2], ...(excerpt ? { excerpt } : {}) },
    projectId,
  };
};

const parseDueSoon = (
  message: string,
  projectId: number | null,
  reminder: boolean,
): ParsedNotificationContent | null => {
  const match = message.match(
    /^La tâche « (.+?) » arrive à échéance le (\d{2}\/\d{2}\/\d{4})\.(?: Merci de la finaliser avant cette date\.)?$/i,
  );
  if (!match) return null;

  const date = toISODate(match[2]);

  return {
    messageKey: reminder ? "dueSoonReminderBody" : "dueSoonBody",
    messageKeyNoProject: reminder ? "dueSoonReminderBodyNoProject" : "dueSoonBodyNoProject",
    params: { task: match[1] },
    projectId,
    date,
  };
};

const parseTaskLate = (message: string, projectId: number | null): ParsedNotificationContent | null => {
  const match = message.match(
    /^La tâche « (.+?) » a dépassé son échéance du (\d{2}\/\d{2}\/\d{4})\.(?: Merci de la traiter au plus vite\.)?$/i,
  );
  if (!match) return null;

  return {
    messageKey: "taskLateBody",
    messageKeyNoProject: "taskLateBodyNoProject",
    params: { task: match[1] },
    projectId,
    date: toISODate(match[2]),
  };
};

const parseAdminPromoted = (message: string): ParsedNotificationContent | null => {
  const match = message.match(/^(.+?) vous a nommé administrateur de l['’]agence « (.+?) »\.?$/i);
  if (!match) return null;

  return {
    messageKey: "adminPromotedBody",
    params: { agency: match[2] },
    projectId: null,
    actor: { name: match[1].trim() },
  };
};

const parseRoleChanged = (message: string): ParsedNotificationContent | null => {
  const match = message.match(
    /^(.+?) a modifié votre rôle dans l['’]agence « (.+?) » : vous êtes désormais « (.+?) »\.?$/i,
  );
  if (!match) return null;

  return {
    messageKey: "roleChangedBody",
    params: { agency: match[2] },
    projectId: null,
    roleKey: /admin/i.test(match[3]) ? "roleAdmin" : "roleMember",
    actor: { name: match[1].trim() },
  };
};

const parseAccountEnabled = (message: string): ParsedNotificationContent | null => {
  const match = message.match(
    /^(.+?) a réactivé votre compte dans l['’]agence « (.+?) » : vos accès sont rétablis\.?$/i,
  );
  if (!match) return null;

  return {
    messageKey: "accountEnabledBody",
    params: { agency: match[2] },
    projectId: null,
    actor: { name: match[1].trim() },
  };
};

const parseAccountDisabled = (message: string): ParsedNotificationContent | null => {
  const match = message.match(
    /^(.+?) a désactivé votre compte dans l['’]agence « (.+?) » : vous n['’]avez plus accès à ses contenus\.?$/i,
  );
  if (!match) return null;

  return {
    messageKey: "accountDisabledBody",
    params: { agency: match[2] },
    projectId: null,
    actor: { name: match[1].trim() },
  };
};

const parseRemovedFromAgency = (message: string): ParsedNotificationContent | null => {
  const match = message.match(/^(.+?) vous a retiré de l['’]agence « (.+?) »\.?$/i);
  if (!match) return null;

  return {
    messageKey: "removedFromAgencyBody",
    params: { agency: match[2] },
    projectId: null,
    actor: { name: match[1].trim() },
  };
};

export const parseNotificationContent = (notification: AppNotification): ParsedNotificationContent | null => {
  const message = (notification.message ?? "").trim();
  const projectId = notificationProjectId(notification);

  switch (notification.type) {
    case "tache_assignee":
      return parseTaskAssigned(message, projectId);
    case "tache_retiree":
      return parseTaskRemoved(message, projectId);
    case "tache_terminee":
      return parseTaskDone(message, projectId);
    case "tache_reouverte":
      return parseTaskReopened(message, projectId);
    case "nouveau_commentaire":
      return parseComment(message, projectId);
    case "mention":
      return parseMention(message, projectId);
    case "echeance_proche":
      return parseDueSoon(message, projectId, false);
    case "rappel_echeance":
      return parseDueSoon(message, projectId, true);
    case "tache_en_retard":
      return parseTaskLate(message, projectId);
    case "nomme_admin":
      return parseAdminPromoted(message);
    case "role_modifie":
      return parseRoleChanged(message);
    case "compte_active":
      return parseAccountEnabled(message);
    case "compte_desactive":
      return parseAccountDisabled(message);
    case "membre_retire":
      return parseRemovedFromAgency(message);
    case "invitation": {
      const parsed = parseInvitationText(notification);
      if (!parsed.agency || !parsed.inviter) return null;

      return {
        messageKey: "invitBody",
        params: { inviter: parsed.inviter, agency: parsed.agency },
        projectId: notificationProjectId(notification),
        roleKey: parsed.role === "admin" ? "roleAdmin" : "roleMember",
      };
    }
    default:
      return null;
  }
};
