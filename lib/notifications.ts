import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  Bell,
  CheckCircle2,
  Clock,
  ListPlus,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
  UserX,
} from "lucide-react";
import { isUnread, type AppNotification } from "./types";

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
  label: string;
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
    label: "Invitation",
    icon: UserPlus,
    color: "var(--color-error)",
    bg: "color-mix(in srgb, var(--color-error) 14%, transparent)",
  },
  tache_assignee: {
    label: "Tâche assignée",
    icon: ListPlus,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  tache_retiree: {
    label: "Retiré d'une tâche",
    icon: UserMinus,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  nouveau_commentaire: {
    label: "Commentaire",
    icon: MessageSquare,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  mention: {
    label: "Mention",
    icon: AtSign,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  echeance_proche: {
    label: "Échéance proche",
    icon: Clock,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  rappel_echeance: {
    label: "Échéance proche",
    icon: Clock,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  tache_en_retard: {
    label: "Tâche en retard",
    icon: AlertTriangle,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  tache_terminee: {
    label: "Tâche terminée",
    icon: CheckCircle2,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  // ---------- Rôles et accès ----------
  // Ce que la personne subit sur son propre compte : nommée administrateur,
  // rétrogradée, activée, désactivée, retirée de l'agence. Même teinte
  // neutre que le reste — ces notifications n'appellent pas de décision.
  nomme_admin: {
    label: "Nommé administrateur",
    icon: ShieldCheck,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  role_modifie: {
    label: "Rôle modifié",
    icon: UserCog,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  compte_active: {
    label: "Compte activé",
    icon: UserCheck,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  compte_desactive: {
    label: "Compte désactivé",
    icon: UserX,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  membre_retire: {
    label: "Retiré de l'agence",
    icon: UserMinus,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
};

export const getNotificationMeta = (type: string): NotificationMeta =>
  META[type] ?? {
    label: "Notification",
    icon: Bell,
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  };

export type NotificationAction = {
  label: string;
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

  return { label: "Accepter l'invitation", href: n.link, icon: ArrowRight };
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
export const NOTIFICATION_FILTERS: { key: string; label: string; types: string[] }[] = [
  { key: "tache_retiree", label: "Retraits", types: ["tache_retiree"] },
  { key: "commentaire", label: "Commentaires", types: ["nouveau_commentaire"] },
  { key: "mention", label: "Mentions", types: ["mention"] },
  // Les deux noms d'échéance relèvent du même réglage de préférence.
  { key: "echeance", label: "Échéances", types: ["echeance_proche", "rappel_echeance"] },
  { key: "retard", label: "En retard", types: ["tache_en_retard"] },
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

export const relativeTime = (dateStr: string): string => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export const formatFullDate = (iso: string): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
