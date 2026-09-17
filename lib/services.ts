// ============================================================
// Services API : toutes les données viennent du backend Laravel.
// Aucune donnée mock locale. Sans backend, ces appels échouent.
// ============================================================
import { api } from "./api";
import { splitName } from "./mappers";
import type {
  ActivityEntry,
  Agency,
  AgencyMember,
  AgencyMemberRole,
  AgencySettings,
  AppNotification,
  Project,
  ProjectMember,
  ProjectStatus,
  Task,
  TaskComment,
  TaskPriority,
  TaskStatus,
  UserLite,
} from "./types";

// ---------- mappers helpers ----------
const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const readonly = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

const mapUser = (u: any): UserLite => {
  const fallback = splitName(str(u.name) ?? "");
  return {
    id: Number(u.id),
    name: str(u.name) ?? "",
    firstName: str(u.first_name) ?? fallback.firstName,
    lastName: str(u.last_name) ?? fallback.lastName,
    email: String(u.email ?? ""),
    avatar: str(u.avatar),
  };
};

const mapAgency = (r: any): Agency => ({
  id: Number(r.id),
  name: String(r.name ?? ""),
  description: str(r.description),
  ownerId: Number(r.owner_id ?? 0),
  myRole: r.my_role === "admin" || r.my_role === "membre" ? r.my_role : null,
  createdAt: str(r.created_at) ?? "",
  members: [],
  settings: r.settings ?? null,
});

const mapMember = (r: any): AgencyMember => ({
  id: Number(r.id),
  role: r.role === "admin" ? "admin" : "membre",
  status: r.status === "actif" ? "actif" : r.status === "en_attente" ? "en_attente" : "inactif",
  user: mapUser(r.user ?? {}),
  joinedAt: str(r.created_at),
});

const mapProject = (r: any): Project => ({
  id: Number(r.id),
  agencyId: Number(r.agency_id ?? 0),
  name: String(r.name ?? ""),
  description: str(r.description),
  status: (r.status ?? "a_venir") as ProjectStatus,
  startDate: str(r.start_date),
  dueDate: str(r.due_date),
  ownerId: Number(r.owner_id ?? 0),
  progress:
    r.progress === null || r.progress === undefined
      ? null
      : Math.round(Number(r.progress)),
  wallpaper: str(r.wallpaper),
  createdAt: str(r.created_at) ?? "",
});

const mapProjectMember = (r: any): ProjectMember => ({
  id: Number(r.id),
  user: mapUser(r.user ?? {}),
});

const mapTask = (r: any): Task => ({
  id: Number(r.id),
  projectId: Number(r.project_id ?? 0),
  title: String(r.title ?? ""),
  description: str(r.description),
  status: (r.status ?? "a_faire") as TaskStatus,
  priority: (r.priority ?? "moyenne") as TaskPriority,
  startDate: str(r.start_date),
  assignedTo: readonly(r.assigned_to),
  assigneeEmail: readonly(r.assigned_to) !== null ? str(r.assignee?.email) : null,
  assigneeName: readonly(r.assigned_to) !== null ? str(r.assignee?.name) : null,
  createdBy: Number(r.created_by ?? 0),
  creatorName: str(r.creator?.name),
  dueDate: str(r.due_date),
  completedAt: str(r.completed_at),
  createdAt: str(r.created_at) ?? "",
});

const mapComment = (r: any): TaskComment => ({
  id: Number(r.id),
  taskId: Number(r.task_id ?? 0),
  authorEmail: String(r.user?.email ?? ""),
  authorName: str(r.user?.name),
  content: String(r.content ?? ""),
  createdAt: str(r.created_at) ?? "",
});

const mapNotification = (r: any): AppNotification => ({
  id: Number(r.id),
  type: String(r.type ?? ""),
  title: str(r.title) ?? "",
  message: str(r.message),
  readAt: str(r.read_at),
  createdAt: str(r.created_at) ?? "",
});

const mapActivity = (r: any): ActivityEntry => ({
  id: Number(r.id),
  actorEmail: String(r.user?.email ?? ""),
  actorName: str(r.user?.name),
  action: String(r.action ?? ""),
  description: str(r.description),
  createdAt: str(r.created_at) ?? "",
  taskId: readonly(r.task_id),
  projectId: readonly(r.project_id),
  agencyId: readonly(r.agency_id),
});

const toApiDate = (d: unknown): string | null => {
  if (!d) return null;
  const s = String(d);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
};

// ---------- Agences ----------
export const fetchAgencies = async (): Promise<Agency[]> => {
  const { data } = await api.get("/agencies");
  return (data as any[] ?? []).map(mapAgency);
};

export const loadAgencyMembers = async (agencyId: number | string): Promise<AgencyMember[]> => {
  const { data } = await api.get(`/agencies/${agencyId}/members`);
  return (data as any[] ?? []).map(mapMember);
};

export const fetchAgency = async (agencyId: number | string): Promise<Agency> =>
  mapAgency((await api.get(`/agencies/${agencyId}`)).data);

export const createAgency = async (payload: {
  name: string;
  description?: string | null;
}): Promise<Agency> => {
  const { data } = await api.post("/agencies", {
    name: payload.name,
    description: payload.description || "",
  });
  return mapAgency(data);
};

export const updateAgency = async (
  agencyId: number | string,
  payload: {
    name?: string;
    description?: string | null;
    settings?: Partial<AgencySettings>;
  },
): Promise<Agency> => mapAgency((await api.put(`/agencies/${agencyId}`, payload)).data);

export const deleteAgency = async (agencyId: number | string): Promise<void> => {
  await api.delete(`/agencies/${agencyId}`);
};

// ---------- Membres d'agence ----------
export const inviteAgencyMember = async (
  agencyId: number | string,
  payload: { email: string; role?: AgencyMemberRole },
): Promise<AgencyMember> =>
  mapMember((await api.post(`/agencies/${agencyId}/members`, payload)).data);

export const updateAgencyMember = async (
  agencyId: number | string,
  memberId: number | string,
  payload: { role?: AgencyMemberRole; status?: string },
): Promise<AgencyMember> =>
  mapMember((await api.put(`/agencies/${agencyId}/members/${memberId}`, payload)).data);

export const removeAgencyMember = async (
  agencyId: number | string,
  memberId: number | string,
): Promise<void> => {
  await api.delete(`/agencies/${agencyId}/members/${memberId}`);
};

export const acceptAgencyInvitation = async (agencyMemberId: number | string): Promise<AgencyMember> =>
  mapMember((await api.post(`/agency-members/${agencyMemberId}/accept`)).data);

// ---------- Projets ----------
export const fetchProjects = async (agencyId: number | string): Promise<Project[]> => {
  const { data } = await api.get(`/agencies/${agencyId}/projects`);
  return (data as any[] ?? []).map(mapProject);
};

export const fetchProject = async (projectId: number | string): Promise<Project> =>
  mapProject((await api.get(`/projects/${projectId}`)).data);

export const fetchProjectMembers = async (projectId: number | string): Promise<ProjectMember[]> => {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return (data as any[] ?? []).map(mapProjectMember);
};

export const createProject = async (
  agencyId: number | string,
  payload: {
    name: string;
    description?: string | null;
    start_date?: string | null;
    due_date?: string | null;
    wallpaper?: string | null;
  },
): Promise<Project> =>
  mapProject(
    (
      await api.post(`/agencies/${agencyId}/projects`, {
        name: payload.name,
        description: payload.description || "",
        start_date: toApiDate(payload.start_date) ?? undefined,
        due_date: toApiDate(payload.due_date) ?? undefined,
        wallpaper: payload.wallpaper || null,
      })
    ).data,
  );

export const updateProject = async (
  projectId: number | string,
  payload: {
    name?: string;
    description?: string | null;
    status?: ProjectStatus;
    start_date?: string | null;
    due_date?: string | null;
    wallpaper?: string | null;
  },
): Promise<Project> => mapProject((await api.put(`/projects/${projectId}`, payload)).data);

export const deleteProject = async (projectId: number | string): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};

export const addProjectMember = async (
  projectId: number | string,
  email: string,
): Promise<ProjectMember> =>
  mapProjectMember((await api.post(`/projects/${projectId}/members`, { email })).data);

export const removeProjectMember = async (
  projectId: number | string,
  projectMemberId: number | string,
): Promise<void> => {
  await api.delete(`/projects/${projectId}/members/${projectMemberId}`);
};

// ---------- Tâches ----------
export const fetchTasks = async (projectId: number | string): Promise<Task[]> => {
  const { data } = await api.get(`/projects/${projectId}/tasks`);
  return (data as any[] ?? []).map(mapTask);
};

export const fetchTask = async (taskId: number | string): Promise<Task> =>
  mapTask((await api.get(`/tasks/${taskId}`)).data);

export const createTask = async (
  projectId: number | string,
  payload: {
    title: string;
    description?: string | null;
    priority?: TaskPriority;
    assigned_to?: number | null;
    start_date?: string | null;
    due_date?: string | null;
  },
): Promise<Task> =>
  mapTask(
    (
      await api.post(`/projects/${projectId}/tasks`, {
        title: payload.title,
        description: payload.description || "",
        priority: payload.priority,
        assigned_to: payload.assigned_to ?? null,
        start_date: toApiDate(payload.start_date) ?? undefined,
        due_date: toApiDate(payload.due_date) ?? undefined,
      })
    ).data,
  );

export const updateTask = async (
  taskId: number | string,
  payload: {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    assigned_to?: number | null;
    start_date?: string | null;
    due_date?: string | null;
  },
): Promise<Task> => mapTask((await api.put(`/tasks/${taskId}`, payload)).data);

export const updateTaskStatus = async (
  taskId: number | string,
  status: TaskStatus,
): Promise<Task> => mapTask((await api.patch(`/tasks/${taskId}/status`, { status })).data);

export const deleteTask = async (taskId: number | string): Promise<void> => {
  await api.delete(`/tasks/${taskId}`);
};

// ---------- Commentaires ----------
export const fetchComments = async (taskId: number | string): Promise<TaskComment[]> => {
  const { data } = await api.get(`/tasks/${taskId}/comments`);
  return (data as any[] ?? []).map(mapComment);
};

export const addComment = async (taskId: number | string, content: string): Promise<TaskComment> =>
  mapComment((await api.post(`/tasks/${taskId}/comments`, { content })).data);

export const deleteComment = async (commentId: number | string): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};

// ---------- Notifications ----------
export const fetchNotifications = async (perPage = 100): Promise<AppNotification[]> => {
  const { data } = await api.get("/notifications", { params: { per_page: perPage } });
  const list = Array.isArray(data) ? data : data?.data ?? [];
  return (list as any[]).map(mapNotification);
};

export const markNotificationRead = async (
  notificationId: number | string,
): Promise<AppNotification> =>
  mapNotification((await api.patch(`/notifications/${notificationId}/read`)).data);

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.post("/notifications/read-all");
};

// ---------- Activité / historique ----------
export const fetchActivity = async (params: {
  taskId?: number | string;
  projectId?: number | string;
  agencyId?: number | string;
}): Promise<ActivityEntry[]> => {
  const query: Record<string, string | number> = {};
  if (params.taskId) query.task_id = params.taskId;
  else if (params.projectId) query.project_id = params.projectId;
  else if (params.agencyId) query.agency_id = params.agencyId;
  else return [];
  const { data } = await api.get("/activity", { params: { ...query, per_page: 100 } });
  const list = Array.isArray(data) ? data : data?.data ?? [];
  return (list as any[]).map(mapActivity);
};

export const getApiErrorMessage = (err: unknown): string => {
  const axiosErr = err as any;
  if (axiosErr?.response?.data?.errors) {
    const errors = axiosErr.response.data.errors;
    const first = Object.values(errors)[0] as string[] | string;
    if (Array.isArray(first)) return first[0];
    if (typeof first === "string") return first;
  }
  if (axiosErr?.response?.data?.message) return axiosErr.response.data.message;
  if (axiosErr?.response?.data?.error) return axiosErr.response.data.error;
  if (axiosErr?.response?.status >= 500) return "Le serveur ne répond pas. Réessayez plus tard.";
  return "Une erreur est survenue.";
};