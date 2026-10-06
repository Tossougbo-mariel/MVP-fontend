// ============================================================
// Statuts de tâches par agence.
// Chaque agence définit ses propres colonnes ; c'est `is_terminal` qui
// décide de ce qui clôt une tâche, pas la clé.
// ============================================================
import { api } from "./api";
import { DEFAULT_TASK_STATUSES, type TaskStatusMeta } from "./types";

export type TaskStatusesPayload = {
  statuses: TaskStatusMeta[];
  uses_defaults: boolean;
};

export type TaskStatusInput = {
  label: string;
  color?: string | null;
  is_terminal?: boolean;
  position?: number;
};

export const fetchTaskStatuses = async (agencyId: number | string): Promise<TaskStatusesPayload> => {
  const { data } = await api.get<TaskStatusesPayload>(
    `/agencies/${agencyId}/task-statuses`,
  );
  return data;
};

export const createTaskStatus = async (
  agencyId: number | string,
  input: TaskStatusInput,
): Promise<TaskStatusMeta> => {
  const { data } = await api.post<TaskStatusMeta>(`/agencies/${agencyId}/task-statuses`, input);
  return data;
};

export const updateTaskStatus = async (
  agencyId: number | string,
  statusId: number,
  input: Partial<TaskStatusInput>,
): Promise<TaskStatusMeta> => {
  const { data } = await api.put<TaskStatusMeta>(
    `/agencies/${agencyId}/task-statuses/${statusId}`,
    input,
  );
  return data;
};

export const deleteTaskStatus = async (
  agencyId: number | string,
  statusId: number,
): Promise<void> => {
  await api.delete(`/agencies/${agencyId}/task-statuses/${statusId}`);
};

/** Déplace les tâches d'un statut vers un autre avant de le supprimer. */
export const reassignTaskStatus = async (
  agencyId: number | string,
  statusId: number,
  to: string,
): Promise<{ moved: number; to: string }> => {
  const { data } = await api.post<{ moved: number; to: string }>(
    `/agencies/${agencyId}/task-statuses/${statusId}/reassign`,
    { to },
  );
  return data;
};

/**
 * Union des clés terminales de plusieurs agences.
 *
 * Pour un écran qui mélange les tâches de plusieurs agences (profil global),
 * aucune liste unique ne convient : on prend l'union, ce qui sur-estime
 * légèrement mais ne fait jamais disparaître une tâche close des compteurs.
 */
export const fetchAllTerminalKeys = async (
  agencyIds: (number | string)[],
): Promise<string[]> => {
  const results = await Promise.allSettled(agencyIds.map((id) => fetchTaskStatuses(id)));

  const keys = new Set<string>(
    DEFAULT_TASK_STATUSES.filter((s) => s.is_terminal).map((s) => s.key),
  );

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const s of r.value.statuses) {
      if (s.is_terminal) keys.add(s.key);
    }
  }

  return [...keys];
};
