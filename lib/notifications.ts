import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  Bell,
  CheckCircle2,
  Clock,
  ListPlus,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
  UserX,
} from "lucide-react";
import { isUnread, type AppNotification } from "./types";
import {
  relativeTime as relativeTimeDate,
  formatDateTimeLong,
} from "./dates";

export function parseInvitationText(n: AppNotification): {
  inviter?: string;
  agency?: string;
  role?: "member" | "admin";
} {
  const source = `${n.title ?? ""} ${n.message ?? ""}`;
  // L'inviteur doit être lu uniquement dans le message : le titre backend
  // ("Invitation à rejoindre …") précède le message et serait sinon avalé
  // par le `^` du regex, puis réinjecté dans la traduction du corps.
  const message = n.message ?? "";
  // Agence : gère "l'agence « ... »", "l'agence \"...\"", "agence ..."
  const agencyMatch =
    source.match(/(?:l['’]|\b)agence\s*[«"']([^»"']+)[»"']/i) ||
    source.match(/(?:the\s+)?agency\s*[«"']([^»"']+)[»"']/i);
  // Inviteur : "Daniel ODAH vous invite", "Daniel ODAH invites you"
  const inviterMatch =
    message.match(/^(.+?)\s+vous\s+invite/i) ||
    message.match(/^(.+?)\s+invites\s+/i);
  const roleMatch =
    source.match(/en\s+tant\s+que\s+(membre|administrateur)/i) ||
    source.match(/as\s+(?:a\s+)?(member|administrator)/i);
  const role: "member" | "admin" | undefined = roleMatch
    ? /admin/i.test(roleMatch[1])
      ? "admin"
      : "member"
    : undefined;
  return {
    inviter: inviterMatch?.[1]?.trim(),
    agency: agencyMatch?.[1]?.trim(),
    role,
  };
}

/**
 * Vocabulaire commun des notifications.
 *
 * Le back envoie des types bruts (`tache_assignee`, `tache_en_retard`…) ; ici
 * on les traduit en libellé, en icône et en couleur, puis en action attendue.
 * La page notifications, le menu de l'en-tête et le toast temps réel partagent
 * cette définition : une notification ne peut pas changer d'apparence d'un
 * écran à l'autre.
 */

export type NotificationMeta = {
  /** Clé de traduction du type de notification, résolue dans le namespace
   *  `Notifications` (fr/en). La lib ne pouvant pas appeler useTranslations,
   *  elle expose une clé et les composants font `t(meta.labelKey)`. */
  labelKey: string;
  icon: typeof Bell;
  /** Couleur du texte/icône : suit le thème (neutre, sauf invitation). */
  color: string;
  /** Teinte plate : fond des étiquettes de type et des boutons d'action. */
  bg: string;
};

const META: Record<string, NotificationMeta> = {
  invitation: {
    // L'invitation est la seule notification qui appelle une décision
    // immédiate : elle garde le rouge, tout le reste reste neutre.
    labelKey: "typeInvitation",
    icon: UserPlus,
    color: "var(--color-error)",
    bg: "color-mix(in srgb, var(--color-error) 14%, transparent)",
  },
  tache_assignee: {
    labelKey: "typeTaskAssigned",
    icon: ListPlus,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  tache_retiree: {
    labelKey: "typeTaskRemoved",
    icon: UserMinus,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  nouveau_commentaire: {
    labelKey: "typeComment",
    icon: MessageSquare,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  mention: {
    labelKey: "typeMention",
    icon: AtSign,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  echeance_proche: {
    labelKey: "typeDueSoon",
    icon: Clock,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  rappel_echeance: {
    labelKey: "typeDueSoon",
    icon: Clock,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  tache_en_retard: {
    labelKey: "typeTaskLate",
    icon: AlertTriangle,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  tache_terminee: {
    labelKey: "typeTaskDone",
    icon: CheckCircle2,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  tache_reouverte: {
    labelKey: "typeTaskReopened",
    icon: RotateCcw,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  // ---------- Rôles et accès ----------
  // Ce que la personne subit sur son propre compte : nommée administrateur,
  // rétrogradée, activée, désactivée, retirée de l'agence. Même teinte
  // neutre que le reste — ces notifications n'appellent pas de décision.
  nomme_admin: {
    labelKey: "typeMadeAdmin",
    icon: ShieldCheck,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  role_modifie: {
    labelKey: "typeRoleChanged",
    icon: UserCog,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  compte_active: {
    labelKey: "typeAccountEnabled",
    icon: UserCheck,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  compte_desactive: {
    labelKey: "typeAccountDisabled",
    icon: UserX,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  membre_retire: {
    labelKey: "typeRemovedFromAgency",
    icon: UserMinus,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
};

export const getNotificationMeta = (type: string): NotificationMeta =>
  META[type] ?? {
    labelKey: "typeDefault",
    icon: Bell,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  };

export type NotificationAction = {
  labelKey: string;
  href: string;
  icon: typeof Bell;
};

/**
 * Seule action portée par une notification : le lien d'invitation.
 *
 * Les notifications de travail (tâche, commentaire, échéance) ne mènent
 * nulle part : on les lit, on les marque lues ou non lues, et c'est tout.
 * `null` partout ailleurs.
 */
export const notificationAction = (n: AppNotification): NotificationAction | null => {
  if (!n.link || n.type !== "invitation") return null;

  return { labelKey: "actionAcceptInvitation", href: n.link, icon: ArrowRight };
};

/**
 * Notification devenue « neutre » : une invitation déjà acceptée perd son
 * lien d'adhésion côté back. Elle n'appelle plus aucune action — on ne peut
 * plus cliquer dessus — et n'existe plus que pour être lue puis supprimée.
 */
export const isNeutralNotification = (n: AppNotification): boolean =>
  n.type === "invitation" && !n.link;

/**
 * Filtres proposés, dans l'ordre d'affichage.
 * « Invitations », « Tâches assignées » et « Terminées » ont été retirés :
 * la liste se lit surtout en « Toutes » / « Non lues ».
 */
export const NOTIFICATION_FILTERS: { key: string; labelKey: string; types: string[] }[] = [
  { key: "tache_retiree", labelKey: "filterRemovals", types: ["tache_retiree"] },
  { key: "commentaire", labelKey: "filterComments", types: ["nouveau_commentaire"] },
  { key: "mention", labelKey: "filterMentions", types: ["mention"] },
  // Les deux noms d'échéance relèvent du même réglage de préférence.
  { key: "echeance", labelKey: "filterDeadlines", types: ["echeance_proche", "rappel_echeance"] },
  { key: "retard", labelKey: "filterLate", types: ["tache_en_retard"] },
];

export const matchesFilter = (n: AppNotification, filterKey: string): boolean => {
  if (filterKey === "toutes") return true;
  if (filterKey === "non-lues") return isUnread(n);
  const group = NOTIFICATION_FILTERS.find((f) => f.key === filterKey);
  return group ? group.types.includes(n.type) : true;
};

/**
 * Une notification appartient-elle à l'affichage d'une agence ?
 * Le rattachement se fait via `agency_id` ; les notifications antérieures à
 * cette colonne sont rattrapées par leur lien (/agences/{id}/…).
 */
export const belongsToAgency = (n: AppNotification, agencyId: number | string): boolean => {
  if (n.agencyId != null) return Number(n.agencyId) === Number(agencyId);
  return (n.link ?? "").startsWith(`/agences/${agencyId}/`);
};

export const relativeTime = (dateStr: string, locale: string = "fr"): string => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return relativeTimeDate(date, locale);
};

export const formatFullDate = (iso: string, locale: string = "fr"): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return formatDateTimeLong(date, locale);
};


