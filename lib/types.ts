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

export type AgencySettings = {
  whoCanInvite: AgencyPermission;
  whoCanCreateProjects: AgencyPermission;
  defaultTaskView: AgencyTaskView;
  defaultMemberRole: AgencyMemberRole;
  emailNotifications: boolean;
};

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  whoCanInvite: "owner",
  whoCanCreateProjects: "admin",
  defaultTaskView: "grid",
  defaultMemberRole: "membre",
  emailNotifications: true,
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
  if (!agency) return false;
  const role = userRoleInAgency(agency, email);
  if (role === "owner" || role === "admin") return true;
  return MEMBRE_RIGHTS.includes(right);
};

// ---------- Projets ----------
export type ProjectStatus = "a_venir" | "en_cours" | "termine" | "archive";

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
};

export type ProjectMember = {
  id: number;
  user: UserLite;
};

// ---------- Tâches ----------
export type TaskStatus = "a_faire" | "en_cours" | "en_revision" | "terminee";
export type TaskPriority = "basse" | "moyenne" | "haute" | "urgente";

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

export const overdueTasks = (list: { deadline: string | null; status: TaskStatus }[]): typeof list => {
  const today = new Date().toISOString().slice(0, 10);
  return list.filter(
    (t) => t.status !== "terminee" && t.deadline !== null && t.deadline < today,
  );
};

export const getProjectStatusFromTasks = (
  currentStatus: ProjectStatus,
  projectTasks: Task[],
): ProjectStatus => {
  if (currentStatus === "archive") return "archive";
  if (projectTasks.length === 0) return "a_venir";
  if (projectTasks.every((t) => t.status === "terminee")) return "termine";
  return "en_cours";
};

const TASK_PROGRESS_CREDITS: Record<TaskStatus, number> = {
  a_faire: 0,
  en_cours: 25,
  en_revision: 70,
  terminee: 100,
};

export const getProjectProgress = (projectTasks: Task[]): number => {
  const total = projectTasks.length;
  if (total === 0) return 0;
  const sum = projectTasks.reduce(
    (acc, t) => acc + (TASK_PROGRESS_CREDITS[t.status] ?? 0),
    0,
  );
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

export const LABEL_STATUS: Record<TaskStatus, string> = {
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
};

// ---------- Commentaires ----------
export type TaskComment = {
  id: number;
  taskId: number;
  authorEmail: string;
  authorName: string | null;
  content: string;
  createdAt: string;
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
};

// ---------- Notifications ----------
export type AppNotification = {
  id: number;
  type: string;
  title: string;
  message: string | null;
  readAt: string | null;
  createdAt: string;
};

export const isUnread = (n: AppNotification): boolean => !n.readAt;