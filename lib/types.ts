// ============================================================
// Types métier du frontend, mappés depuis l'API Laravel.
// Source de vérité unique : le backend. Aucune donnée locale.
// ============================================================

// ---------- Utilisateur ----------
export type UserLite = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  /** Poste / métier saisi par la personne dans son profil. Null si non renseigné. */
  jobTitle: string | null;
};

// ---------- Agences ----------
export type AgencyMemberRole = "admin" | "membre";
export type AgencyMemberStatus = "actif" | "en_attente" | "inactif";

export type AgencyMember = {
  id: number; // id du membership (pour PUT/DELETE)
  role: AgencyMemberRole;
  status: AgencyMemberStatus;
  user: UserLite;
  joinedAt: string | null; // date d'adhésion (created_at du membership), si fournie par l'API
};

export type AgencyInvitationStatus = "en_attente" | "acceptee" | "annulee" | "expiree";

export type AgencyInvitation = {
  id: number;
  agencyId: number;
  email: string;
  role: AgencyMemberRole;
  token: string;
  status: AgencyInvitationStatus;
  invitedBy: string | null; // nom de la personne qui a invité
  expiresAt: string | null;
  createdAt: string;
};

export type InvitationPreview = {
  token: string;
  email: string;
  role: AgencyMemberRole;
  expiresAt: string | null;
  agency: { id: number; name: string };
  hasAccount: boolean;
};

export type AgencyRole = "owner" | "admin" | "membre";

// ---------- Réglages d'agence (gérés par le propriétaire) ----------
export type AgencyPermission = "owner" | "admin" | "all";
export type AgencyTaskView = "grid" | "list" | "kanban";
export type AgencyTeamMembership = "ouverte" | "fermee";

export type AgencySettings = {
  whoCanInvite: AgencyPermission;
  whoCanCreateProjects: AgencyPermission;
  defaultTaskView: AgencyTaskView;
  defaultMemberRole: AgencyMemberRole;
  emailNotifications: boolean;
  whoCanManageTeams: AgencyPermission;
  defaultTeamMembership: AgencyTeamMembership;
};

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  whoCanInvite: "owner",
  whoCanCreateProjects: "admin",
  defaultTaskView: "grid",
  defaultMemberRole: "membre",
  emailNotifications: true,
  whoCanManageTeams: "admin",
  defaultTeamMembership: "fermee",
};

export type AgencyTeam = {
  id: number;
  name: string;
  description: string | null;
  membership: AgencyTeamMembership;
  createdBy: number | null;
  memberCount: number;
  members: UserLite[];
};

export type Agency = {
  id: number;
  name: string;
  description: string | null;
  ownerId: number; // user_id du propriétaire
  myRole: AgencyMemberRole | null; // rôle de l'utilisateur connecté
  createdAt: string;
  members: AgencyMember[];
  settings: AgencySettings | null;
};

export type DisplayMember = AgencyMember & { color: string };

export const OWNER_COLOR = "#C7961A";
export const MEMBER_COLORS = [
  "#5B5BD6",
  "#0D9488",
  "#7C3AED",
  "#0EA5A0",
  "#0369A1",
  "#8B5CF6",
  "#0891B2",
  "#4C6EF5",
];

export const colorizeMembers = (members: AgencyMember[], ownerId: number): DisplayMember[] => {
  const used: string[] = [];
  return members.map((m) => {
    if (m.user.id === ownerId) {
      used.push(OWNER_COLOR);
      return { ...m, color: OWNER_COLOR };
    }
    const free = MEMBER_COLORS.find((c) => !used.includes(c.toLowerCase()));
    const color = free ?? MEMBER_COLORS[used.length % MEMBER_COLORS.length];
    used.push(color);
    return { ...m, color };
  });
};

export const memberDisplayName = (m: AgencyMember): string =>
  `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() || m.user.name || m.user.email;

export const memberInitials = (m: AgencyMember): string =>
  (m.user.firstName.charAt(0) + m.user.lastName.charAt(0)).toUpperCase() || m.user.email.charAt(0).toUpperCase();

// ---------- Helpers agences (mêmes signatures que l'ancien agencyStore) ----------
export const agencyOwnerEmail = (a: Agency): string => {
  const owner = (a.members ?? []).find((m) => m.user.id === a.ownerId);
  return owner?.user.email?.toLowerCase() ?? "";
};

export const isAgencyOwner = (a: Agency, email: string): boolean => {
  const owner = agencyOwnerEmail(a);
  return Boolean(owner && owner === email.toLowerCase());
};

export const userRoleInAgency = (a: Agency, email: string): AgencyRole => {
  if (isAgencyOwner(a, email)) return "owner";
  return a.myRole ?? "membre";
};

export const userAgencies = (agencies: Agency[], email: string): Agency[] => {
  const e = (email ?? "").toLowerCase();
  return agencies.filter((a) =>
    (a.members ?? []).some((m) => m.user.email.toLowerCase() === e),
  );
};

export type TaskPlatformRight =
  | "invite"
  | "manageUsers"
  | "manageTeams"
  | "createProjects"
  | "deleteProjects"
  | "createTasks"
  | "modifyTasks"
  | "assignTasks"
  | "viewAllTasks"
  | "changeStatuses"
  | "viewDashboard"
  | "viewHistory";

const MEMBRE_RIGHTS: TaskPlatformRight[] = [
  "viewDashboard",
  "viewHistory",
  "changeStatuses",
  "viewAllTasks",
];

export const hasRight = (
  agency: Agency | null | undefined,
  email: string,
  right: TaskPlatformRight,
): boolean => {
  if (!agency || !email) return false;
  const role = userRoleInAgency(agency, email);
  if (role === "owner" || role === "admin") return true;
  const settings = agency.settings ?? DEFAULT_AGENCY_SETTINGS;

  if (right === "invite") {
    return settings.whoCanInvite === "all";
  }

  if (right === "createProjects") {
    return settings.whoCanCreateProjects === "all";
  }

  if (right === "manageTeams") {
    return settings.whoCanManageTeams === "all";
  }

  return MEMBRE_RIGHTS.includes(right);
};

// ---------- Projets ----------
export type ProjectStatus = "a_venir" | "en_cours" | "termine" | "archive" | "en_retard";

export type Project = {
  id: number;
  agencyId: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  ownerId: number;
  progress: number | null;
  createdAt: string;
  wallpaper?: string | null;
  tasks?: Task[];
};

export type ProjectMember = {
  id: number;
  user: UserLite;
};

// ---------- Tâches ----------

/**
 * Une clé de statut. Volontairement un `string` et non une union : chaque
 * agence définit ses propres colonnes, et `tasks.status` peut déjà contenir
 * les quatre clés historiques. Ce qui décide qu'une tâche est close, c'est
 * `is_terminal` du statut — jamais la clé elle-même.
 *
 * `DEFAULT_TASK_STATUSES` sert de repli tant que l'API n'a pas répondu, ce qui
 * rend le comportement identique à l'existant pour une agence sans
 * personnalisation.
 */
export type TaskStatus = string;

export type TaskStatusMeta = {
  key: string;
  label: string;
  color: string;
  is_terminal: boolean;
  /**
   * Identifiant de la ligne en base, `null` pour un statut historique non
   * personnalisé : ces colonnes existent par défaut mais n'ont pas de ligne,
   * donc on ne peut pas les modifier ni les supprimer directement — il faut les
   * personnaliser, ce qui crée la ligne.
   */
  id?: number | null;
};

export const DEFAULT_TASK_STATUSES: TaskStatusMeta[] = [
  { key: "a_faire", label: "À faire", color: "#ef4444", is_terminal: false },
  { key: "en_cours", label: "En cours", color: "#f59e0b", is_terminal: false },
  { key: "en_revision", label: "En révision", color: "#589bff", is_terminal: false },
  { key: "terminee", label: "Terminée", color: "#10b981", is_terminal: true },
];

/**
 * Statut terminal ? Sans liste fournie, on retombe sur le vocabulaire
 * historique plutôt que de considérer la tâche comme close : une donnée
 * inconnue ne doit pas disparaître des listes « en cours ».
 */
export const isTerminalStatus = (status: TaskStatus, statuses?: TaskStatusMeta[]): boolean => {
  const list = statuses ?? DEFAULT_TASK_STATUSES;
  const match = list.find((s) => s.key === status);
  return match
    ? match.is_terminal
    : ["terminee", "termine", "done"].includes(status);
};

export const taskStatusLabel = (status: TaskStatus, statuses?: TaskStatusMeta[]): string =>
  (statuses ?? DEFAULT_TASK_STATUSES).find((s) => s.key === status)?.label ??
  LABEL_STATUS[status] ??
  status;

export const taskStatusColor = (status: TaskStatus, statuses?: TaskStatusMeta[]): string =>
  (statuses ?? DEFAULT_TASK_STATUSES).find((s) => s.key === status)?.color ??
  DEFAULT_TASK_STATUSES.find((s) => s.key === status)?.color ??
  "#94a3b8";

export type TaskPriority = "basse" | "moyenne" | "haute" | "urgente";
export type TaskDeadlineStatus = "a_venir" | "a_echeance" | "en_retard" | null;

export const DEADLINE_META: Record<"a_echeance" | "en_retard", { label: string; color: string; bg: string }> = {
  a_echeance: { label: "À échéance", color: "#d97706", bg: "rgba(217,119,6,0.14)" },
  en_retard: { label: "En retard", color: "#D85A30", bg: "rgba(216,90,48,0.14)" },
};

export type TaskDepRef = {
  id: number;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
};

export type Task = {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  assignedTo: number | null; // user id
  assigneeEmail: string | null;
  assigneeName: string | null;
  createdBy: number;
  creatorName: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  archivedAt: string | null;
  tags: Tag[];
  dependencies?: TaskDepRef[];
  dependents?: TaskDepRef[];
  deadlineStatus: TaskDeadlineStatus;
};

export type MyTask = {
  id: number;
  title: string;
  description: string | null;
  agencyId: number;
  projectId: number;
  projectName: string;
  assigneeEmail: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  createdAt: string;
  completedAt: string | null;
  deadlineStatus: TaskDeadlineStatus;
};

export const getTasksByProject = (tasks: Task[], projectId: number | string): Task[] =>
  tasks.filter((t) => Number(t.projectId) === Number(projectId));

export const getTasksByAgency = (
  tasks: Task[],
  projects: Project[],
  agencyId: number | string,
): Task[] => {
  const agencyProjects = projects.filter((p) => Number(p.agencyId) === Number(agencyId));
  const ids = new Set(agencyProjects.map((p) => p.id));
  return tasks.filter((t) => ids.has(t.projectId));
};

export const buildMyTask = (t: Task, project?: Project): MyTask => ({
  id: t.id,
  title: t.title,
  description: t.description,
  agencyId: project?.agencyId ?? 0,
  projectId: t.projectId,
  projectName: project?.name ?? "",
  assigneeEmail: t.assigneeEmail,
  status: t.status,
  priority: t.priority,
  deadline: t.dueDate ?? t.startDate ?? null,
  createdAt: t.createdAt,
  completedAt: t.completedAt,
  deadlineStatus: t.deadlineStatus,
});

export const myTasksFor = (
  tasks: Task[],
  projects: Project[],
  userEmail: string,
): MyTask[] => {
  const projectById = new Map(projects.map((p) => [p.id, p]));
  return tasks
    .filter((t) => (t.assigneeEmail ?? "").toLowerCase() === userEmail.toLowerCase())
    .map((t) => buildMyTask(t, projectById.get(t.projectId)));
};

export const overdueTasks = (
  list: { deadline: string | null; status: TaskStatus }[],
  statuses?: TaskStatusMeta[],
): typeof list => {
  const today = new Date().toISOString().slice(0, 10);
  return list.filter(
    (t) => !isTerminalStatus(t.status, statuses) && t.deadline !== null && t.deadline < today,
  );
};

export const getProjectStatusFromTasks = (
  currentStatus: ProjectStatus,
  projectTasks: Task[],
  statuses?: TaskStatusMeta[],
): ProjectStatus => {
  if (currentStatus === "archive") return "archive";
  if (projectTasks.length === 0) return "a_venir";
  if (projectTasks.every((t) => t.status === "terminee")) return "termine";
  // Une tâche dont l'échéance est passée met le projet en retard.
  // deadline_status est déjà null pour les tâches terminées (Task.php:21-23).
  if (projectTasks.some((t) => t.deadlineStatus === "en_retard")) return "en_retard";
  if (projectTasks.every((t) => isTerminalStatus(t.status, statuses))) return "termine";
  return "en_cours";
};

/**
 * Poids de chaque statut : sa position dans la liste (la dernière colonne vaut
 * 100), les terminaux valant toujours 100. Reproduit exactement les anciens
 * crédits fixes 0/25/70/100 sur la liste par défaut.
 */
const progressCredits = (statuses?: TaskStatusMeta[]): Record<string, number> => {
  const list = statuses ?? DEFAULT_TASK_STATUSES;
  const lastIndex = Math.max(0, list.length - 1);
  const credits: Record<string, number> = {};

  list.forEach((s, i) => {
    credits[s.key] = s.is_terminal || lastIndex === 0 ? 100 : Math.round((i / lastIndex) * 100);
  });

  return credits;
};

export const getProjectProgress = (
  projectTasks: Task[],
  statuses?: TaskStatusMeta[],
): number => {
  const total = projectTasks.length;
  if (total === 0) return 0;
  const credits = progressCredits(statuses);
  const sum = projectTasks.reduce((acc, t) => acc + (credits[t.status] ?? 0), 0);
  return Math.round(sum / total);
};

export const getProjectsByAgency = (
  projects: Project[],
  agencyId: number | string,
): Project[] => projects.filter((p) => Number(p.agencyId) === Number(agencyId));

export const getProjectById = (
  projects: Project[],
  projectId: number | string,
): Project | undefined => projects.find((p) => Number(p.id) === Number(projectId));

export const getTaskById = (tasks: Task[], taskId: number | string): Task | undefined =>
  tasks.find((t) => Number(t.id) === Number(taskId));

/**
 * Libellés des statuts historiques. `Record<string, string>` car les clés sont
 * désormais dynamiques ; à indexer de préférence via `taskStatusLabel()`,
 * qui tient compte de la personnalisation de l'agence.
 */
export const LABEL_STATUS: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  en_revision: "En révision",
  terminee: "Terminée",
};

export const LABEL_PRIORITY: Record<TaskPriority, string> = {
  basse: "Basse",
  moyenne: "Moyenne",
  haute: "Haute",
  urgente: "Urgente",
};

export const LABEL_PROJECT_STATUS: Record<ProjectStatus, string> = {
  a_venir: "À venir",
  en_cours: "En cours",
  termine: "Terminé",
  archive: "Archivé",
  en_retard: "En retard",
};

// ---------- Étiquettes ----------
export type Tag = {
  id: number;
  agencyId: number;
  name: string;
  color: string;
};

// ---------- Pièces jointes ----------
export type Attachment = {
  id: number;
  taskId: number;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  uploaderId: number | null;
  authorName: string | null;
  createdAt: string;
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes < 1024) return `${bytes || 0} o`;
  const units = ["Ko", "Mo", "Go"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
};

// ---------- Sous-tâches ----------
export type Subtask = {
  id: number;
  taskId: number;
  title: string;
  done: boolean;
  position: number;
  imposed: boolean;
};

export const subtaskProgress = (
  list: Subtask[],
): { done: number; total: number; percent: number } => {
  const total = list.length;
  const done = list.filter((s) => s.done).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
};

// ---------- Commentaires ----------
export type TaskComment = {
  id: number;
  taskId: number;
  authorEmail: string;
  authorName: string | null;
  content: string;
  mentionIds: number[];
  createdAt: string;
};

// ---------- Préférences de notifications ----------
export type NotificationPreferences = {
  task_assigned: boolean;
  task_completed: boolean;
  task_removed: boolean;
  comment: boolean;
  mention: boolean;
  deadline_reminder: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  task_assigned: true,
  task_completed: true,
  task_removed: true,
  comment: true,
  mention: true,
  deadline_reminder: true,
};

export const LABEL_NOTIFICATION_PREFERENCE: Record<keyof NotificationPreferences, string> = {
  task_assigned: "Nouvelle tâche assignée",
  task_completed: "Tâche terminée",
  task_removed: "Retiré d'une tâche",
  comment: "Nouveau commentaire",
  mention: "Mention (@)",
  deadline_reminder: "Rappel d'échéance",
};

export const getCommentsByTask = (
  comments: TaskComment[],
  taskId: number | string,
): TaskComment[] =>
  comments
    .filter((c) => Number(c.taskId) === Number(taskId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

// ---------- Historique / journal ----------
export type ActivityEntry = {
  id: number;
  actorEmail: string;
  actorName: string | null;
  action: string;
  description: string | null;
  createdAt: string;
  taskId: number | null;
  projectId: number | null;
  agencyId: number | null;
};

export const getHistoryByTask = (
  history: ActivityEntry[],
  taskId: number | string,
): ActivityEntry[] =>
  history
    .filter((h) => Number(h.taskId) === Number(taskId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

export const ACTIVITY_LABELS: Record<string, string> = {
  creation: "Tâche créée",
  changement_statut: "Statut modifié",
  tache_terminee: "Tâche terminée",
  changement_responsable: "Responsable modifié",
  changement_priorite: "Priorité modifiée",
  changement_echeance: "Échéance modifiée",
  commentaire: "Commentaire ajouté",
  creation_projet: "Projet créé",
  membre_ajoute: "Membre ajouté",
};

/**
 * Tâche close, vu depuis un écran qui mélange plusieurs agences.
 *
 * `completedAt` est la source la plus fiable : le backend le renseigne
 * d'après le `is_terminal` du statut, quel que soit son nom. On complète avec
 * le vocabulaire historique pour les tâches closes avant que cette colonne ne
 * soit gérée.
 */
export const isTaskDone = (t: {
  status: TaskStatus;
  completedAt?: string | null;
}): boolean =>
  t.completedAt != null || ["terminee", "termine", "done"].includes(t.status);

// Une tâche est bloquée si une de ses dépendances n'est pas terminée
export const isTaskBlocked = (
  task: Pick<Task, "dependencies">,
  statuses?: TaskStatusMeta[],
): boolean => (task.dependencies ?? []).some((d) => !isTerminalStatus(d.status, statuses));

// ---------- Notifications ----------
export type AppNotification = {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export const isUnread = (n: AppNotification): boolean => !n.readAt;