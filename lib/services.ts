// ============================================================
// Services API : toutes les données viennent du backend Laravel.
// Aucune donnée mock locale. Sans backend, ces appels échouent.
// ============================================================
import { api } from "./api";
import { splitName } from "./mappers";
import type {
  ActivityEntry,
  Agency,
  AgencyInvitation,
  AgencyMember,
  AgencyMemberRole,
  AgencySettings,
  AgencyTeam,
  AppNotification,
  Attachment,
  InvitationPreview,
  NotificationPreferences,
  Project,
  ProjectMember,
  ProjectStatus,
  Subtask,
  Tag,
  Task,
  TaskComment,
  TaskDepRef,
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

const mapRole = (r: any): AgencyMemberRole => (r === "admin" ? "admin" : "membre");

const mapAgency = (r: any): Agency => ({
  id: Number(r.id),
  name: String(r.name ?? ""),
  description: str(r.description),
  ownerId: Number(r.owner_id ?? 0),
  myRole:
    r.my_role === "admin" || r.my_role === "membre"
      ? r.my_role
      : null,
  createdAt: str(r.created_at) ?? "",
  members: [],
  settings: r.settings ?? null,
});

const mapMember = (r: any): AgencyMember => ({
  id: Number(r.id),
  role: mapRole(r.role),
  status: r.status === "actif" ? "actif" : r.status === "en_attente" ? "en_attente" : "inactif",
  user: mapUser(r.user ?? {}),
  joinedAt: str(r.created_at),
});

const mapInvitation = (r: any): AgencyInvitation => ({
  id: Number(r.id),
  agencyId: Number(r.agency_id ?? 0),
  email: String(r.email ?? ""),
  role: mapRole(r.role),
  token: String(r.token ?? ""),
  status: ["en_attente", "acceptee", "annulee", "expiree"].includes(r.status)
    ? r.status
    : "en_attente",
  invitedBy: str(r.invited_by?.name) ?? str(r.invited_by_name) ?? null,
  expiresAt: str(r.expires_at),
  createdAt: str(r.created_at) ?? "",
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

const mapTag = (r: any): Tag => ({
  id: Number(r.id),
  agencyId: Number(r.agency_id ?? 0),
  name: String(r.name ?? ""),
  color: String(r.color ?? "#056cf2"),
});

const mapDepRef = (r: any): TaskDepRef => ({
  id: Number(r.id),
  title: String(r.title ?? ""),
  status: (r.status ?? "a_faire") as TaskStatus,
  dueDate: str(r.due_date),
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
  archivedAt: str(r.archived_at),
  tags: Array.isArray(r.tags) ? (r.tags as any[]).map(mapTag) : [],
  dependencies: Array.isArray(r.dependencies) ? (r.dependencies as any[]).map(mapDepRef) : [],
  dependents: Array.isArray(r.dependents) ? (r.dependents as any[]).map(mapDepRef) : [],
});

const mapSubtask = (r: any): Subtask => ({
  id: Number(r.id),
  taskId: Number(r.task_id ?? 0),
  title: String(r.title ?? ""),
  done: Boolean(r.done),
  position: Number(r.position ?? 0),
});

const mapAttachment = (r: any): Attachment => ({
  id: Number(r.id),
  taskId: Number(r.task_id ?? 0),
  fileName: String(r.file_name ?? ""),
  fileSize: Number(r.file_size ?? 0),
  mimeType: str(r.mime_type),
  uploaderId: readonly(r.user_id),
  authorName: str(r.user?.name),
  createdAt: str(r.created_at) ?? "",
});

const mapComment = (r: any): TaskComment => ({
  id: Number(r.id),
  taskId: Number(r.task_id ?? 0),
  authorEmail: String(r.user?.email ?? ""),
  authorName: str(r.user?.name),
  content: String(r.content ?? ""),
  mentionIds: Array.isArray(r.mention_ids)
    ? (r.mention_ids as any[]).map((id) => Number(id))
    : [],
  createdAt: str(r.created_at) ?? "",
});

const mapNotification = (r: any): AppNotification => ({  id: Number(r.id),
  type: String(r.type ?? ""),
  title: str(r.title) ?? "",
  message: str(r.message),
  link: str(r.link),
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



// ---------- Invitations d'agence ----------
export const createInvitation = async (
  agencyId: number | string,
  payload: { email: string; role?: AgencyMemberRole },
): Promise<AgencyInvitation> =>
  mapInvitation((await api.post(`/agencies/${agencyId}/invitations`, payload)).data);

export const fetchAgencyInvitations = async (
  agencyId: number | string,
): Promise<AgencyInvitation[]> => {
  const list = (await api.get(`/agencies/${agencyId}/invitations`)).data;
  return (Array.isArray(list) ? list : []).map(mapInvitation);
};

export const resendInvitation = async (
  agencyId: number | string,
  invitationId: number | string,
): Promise<AgencyInvitation> =>
  mapInvitation((await api.post(`/agencies/${agencyId}/invitations/${invitationId}/resend`)).data);

export const cancelInvitation = async (
  agencyId: number | string,
  invitationId: number | string,
): Promise<void> => {
  await api.delete(`/agencies/${agencyId}/invitations/${invitationId}`);
};

export const fetchInvitationPreview = async (token: string): Promise<InvitationPreview> => {
  const data = (await api.get(`/invitations/${token}`)).data;
  return { ...data, hasAccount: Boolean(data.has_account) };
};

export const acceptInvitation = async (token: string): Promise<void> => {
  await api.post(`/invitations/${token}/accept`);
};

// ---------- Équipes ----------
const mapTeamMember = (u: any): UserLite =>
  u ? { id: Number(u.id), name: str(u.name) ?? "", firstName: str(u.first_name) ?? "", lastName: str(u.last_name) ?? "", email: String(u.email ?? ""), avatar: str(u.avatar) } : null as any;

const mapTeam = (r: any): AgencyTeam => ({
  id: Number(r.id),
  name: String(r.name ?? ""),
  description: str(r.description),
  membership: r.membership === "ouverte" ? "ouverte" : "fermee",
  createdBy: readonly(r.created_by),
  memberCount: Number(r.member_count ?? 0),
  members: (Array.isArray(r.members) ? r.members : []).map(mapTeamMember),
});

export const fetchAgencyTeams = async (agencyId: number | string): Promise<AgencyTeam[]> => {
  const list = (await api.get(`/agencies/${agencyId}/teams`)).data;
  return (Array.isArray(list) ? list : []).map(mapTeam);
};

export const createAgencyTeam = async (
  agencyId: number | string,
  payload: { name: string; description?: string | null; membership?: string; memberIds?: number[] },
): Promise<AgencyTeam> =>
  mapTeam((await api.post(`/agencies/${agencyId}/teams`, {
    name: payload.name,
    description: payload.description || "",
    membership: payload.membership,
    member_ids: payload.memberIds,
  })).data);

export const updateTeam = async (
  teamId: number | string,
  payload: { name?: string; description?: string | null; membership?: string; memberIds?: number[] },
): Promise<AgencyTeam> =>
  mapTeam((await api.put(`/teams/${teamId}`, {
    name: payload.name,
    description: payload.description,
    membership: payload.membership,
    member_ids: payload.memberIds,
  })).data);

export const deleteTeam = async (teamId: number | string): Promise<void> => {
  await api.delete(`/teams/${teamId}`);
};

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

// ---------- Dépendances entre tâches ----------
export type TaskDependencyBundle = {
  dependencies: TaskDepRef[];
  dependents: TaskDepRef[];
};

const mapDependencyBundle = (data: any): TaskDependencyBundle => ({
  dependencies: (data?.dependencies ?? []).map(mapDepRef),
  dependents: (data?.dependents ?? []).map(mapDepRef),
});

export const fetchTaskDependencies = async (
  taskId: number | string,
): Promise<TaskDependencyBundle> =>
  mapDependencyBundle((await api.get(`/tasks/${taskId}/dependencies`)).data);

export const addTaskDependency = async (
  taskId: number | string,
  dependsOnTaskId: number,
): Promise<TaskDependencyBundle> =>
  mapDependencyBundle(
    (await api.post(`/tasks/${taskId}/dependencies`, { depends_on_task_id: dependsOnTaskId })).data,
  );

export const removeTaskDependency = async (
  taskId: number | string,
  dependencyId: number | string,
): Promise<TaskDependencyBundle> =>
  mapDependencyBundle((await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`)).data);

export const updateTaskStatus = async (
  taskId: number | string,
  status: TaskStatus,
  options?: { force?: boolean },
): Promise<Task> =>
  mapTask(
    (await api.patch(`/tasks/${taskId}/status`, { status, ...(options?.force ? { force: true } : {}) })).data
  );

export const deleteTask = async (taskId: number | string): Promise<void> => {
  await api.delete(`/tasks/${taskId}`);
};

export const archiveTask = async (taskId: number | string): Promise<Task> =>
  mapTask((await api.patch(`/tasks/${taskId}/archive`)).data);

export const restoreTask = async (taskId: number | string): Promise<Task> =>
  mapTask((await api.patch(`/tasks/${taskId}/restore`)).data);

export type BulkTaskUpdate = {
  task_ids: number[];
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: number | null;
  add_tag_ids?: number[];
};

export const bulkUpdateTasks = async (
  projectId: number | string,
  payload: BulkTaskUpdate,
  options?: { force?: boolean },
): Promise<Task[]> => {
  const { data } = await api.post(`/projects/${projectId}/tasks/bulk`, {
    ...payload,
    ...(options?.force ? { force: true } : {}),
  });
  return (data as any[] ?? []).map(mapTask);
};

// ---------- Export CSV ----------
export const downloadAgencyTasksCsv = async (agencyId: number | string): Promise<void> => {
  const { data } = await api.get(`/agencies/${agencyId}/tasks/export`, { responseType: "blob" });
  const url = URL.createObjectURL(data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `taches-${agencyId}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// ---------- Étiquettes ----------
export const fetchAgencyTags = async (agencyId: number | string): Promise<Tag[]> => {
  const { data } = await api.get(`/agencies/${agencyId}/tags`);
  return (data as any[] ?? []).map(mapTag);
};

export const createTag = async (
  agencyId: number | string,
  payload: { name: string; color?: string },
): Promise<Tag> => mapTag((await api.post(`/agencies/${agencyId}/tags`, payload)).data);

export const updateTag = async (
  tagId: number | string,
  payload: { name?: string; color?: string },
): Promise<Tag> => mapTag((await api.put(`/tags/${tagId}`, payload)).data);

export const deleteTag = async (tagId: number | string): Promise<void> => {
  await api.delete(`/tags/${tagId}`);
};

export const setTaskTags = async (
  taskId: number | string,
  tagIds: number[],
): Promise<Tag[]> => {
  const { data } = await api.put(`/tasks/${taskId}/tags`, { tag_ids: tagIds });
  const list = Array.isArray(data?.tags) ? data.tags : [];
  return (list as any[]).map(mapTag);
};

// ---------- Pièces jointes ----------
export const fetchAttachments = async (taskId: number | string): Promise<Attachment[]> => {
  const { data } = await api.get(`/tasks/${taskId}/attachments`);
  return (data as any[] ?? []).map(mapAttachment);
};

export const uploadAttachment = async (
  taskId: number | string,
  file: File,
): Promise<Attachment> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/tasks/${taskId}/attachments`, form, {
    headers: { "Content-Type": undefined },
  });
  return mapAttachment(data);
};

export const deleteAttachment = async (attachmentId: number | string): Promise<void> => {
  await api.delete(`/attachments/${attachmentId}`);
};

export const downloadAttachment = async (attachment: Attachment): Promise<void> => {
  const { data } = await api.get(`/attachments/${attachment.id}/download`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = attachment.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// ---------- Sous-tâches ----------
export const fetchSubtasks = async (taskId: number | string): Promise<Subtask[]> => {
  const { data } = await api.get(`/tasks/${taskId}/subtasks`);
  return (data as any[] ?? []).map(mapSubtask);
};

export const createSubtask = async (
  taskId: number | string,
  title: string,
): Promise<Subtask> =>
  mapSubtask((await api.post(`/tasks/${taskId}/subtasks`, { title })).data);

export const updateSubtask = async (
  subtaskId: number | string,
  payload: { title?: string; done?: boolean; position?: number },
): Promise<Subtask> => mapSubtask((await api.put(`/subtasks/${subtaskId}`, payload)).data);

export const deleteSubtask = async (subtaskId: number | string): Promise<void> => {
  await api.delete(`/subtasks/${subtaskId}`);
};

// ---------- Commentaires ----------
export const fetchComments = async (taskId: number | string): Promise<TaskComment[]> => {
  const { data } = await api.get(`/tasks/${taskId}/comments`);
  return (data as any[] ?? []).map(mapComment);
};

export const addComment = async (
  taskId: number | string,
  content: string,
  mentionIds: number[] = [],
): Promise<TaskComment> =>
  mapComment(
    (await api.post(`/tasks/${taskId}/comments`, { content, mention_ids: mentionIds })).data,
  );

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

// ---------- Préférences de notifications ----------
export const fetchNotificationPreferences = async (): Promise<NotificationPreferences> =>
  (await api.get("/me/notification-preferences")).data;

export const updateNotificationPreferences = async (
  payload: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> =>
  (await api.put("/me/notification-preferences", payload)).data;

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