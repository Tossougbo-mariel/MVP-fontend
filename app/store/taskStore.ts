"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Task, TaskStatus, TaskPriority } from "./agencyStore";
import { useAuthStore } from "./authStore";
import { useHistoryStore } from "./historyStore";

// ✅ Toutes les tâches d'un projet (table à part, filtrée par projectId)
export const getTasksByProject = (tasks: Task[], projectId: string): Task[] =>
  tasks.filter((t) => t.projectId === projectId);

const labelOfPriority: Record<TaskPriority, string> = {
  basse: "Basse",
  moyenne: "Moyenne",
  haute: "Haute",
  urgente: "Urgente",
};

const labelOfStatus: Record<TaskStatus, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  en_revision: "En révision",
  terminee: "Terminée",
};

const formatDateShort = (date: string | null) => date ?? "—";

type CreateTaskData = {
  projectId: string;
  title: string;
  description: string;
  status?: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  assignedTo: string | null; // email du membre assigné (facultatif)
  createdBy: string;
  dueDate: string;
};

type TaskState = {
  tasks: Task[];
  createTask: (data: CreateTaskData) => Task;
  updateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "projectId" | "createdBy" | "createdAt">>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  deleteTasksByProject: (projectId: string) => void;
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [] as Task[],

      // ✅ Création d'une tâche dans un projet (statut initial « à faire »)
      createTask: (data) => {
        const task: Task = {
          id: "tache" + Date.now(),
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          status: data.status ?? "a_faire",
          priority: data.priority,
          startDate: data.startDate,
          assignedTo: data.assignedTo,
          createdBy: data.createdBy,
          dueDate: data.dueDate,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        useHistoryStore.getState().addHistoryEntry({
          taskId: task.id,
          type: "creation",
          actorEmail: data.createdBy,
          description: "Tâche créée",
        });
        return task;
      },

      // ✅ Déplacement d'une carte entre colonnes (drag & drop)
      updateTaskStatus: (taskId, status) =>
        set((state) => {
          const current = state.tasks.find((t) => t.id === taskId);
          if (!current || current.status === status) return state;
          const actorEmail = useAuthStore.getState().user?.email ?? "inconnu";
          useHistoryStore.getState().addHistoryEntry({
            taskId,
            type: status === "terminee" ? "terminee" : "statut",
            actorEmail,
            description:
              status === "terminee"
                ? "Tâche terminée"
                : `Statut changé : ${labelOfStatus[current.status]} → ${labelOfStatus[status]}`,
            oldValue: current.status,
            newValue: status,
          });
          return {
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, status } : t
            ),
          };
        }),

      // ✅ Mise à jour des champs modifiables d'une tâche
      updateTask: (taskId, patch) =>
        set((state) => {
          const current = state.tasks.find((t) => t.id === taskId);
          if (!current) return state;
          const actorEmail = useAuthStore.getState().user?.email ?? "inconnu";
          const history = useHistoryStore.getState();

          if (patch.priority && patch.priority !== current.priority) {
            history.addHistoryEntry({
              taskId,
              type: "priorite",
              actorEmail,
              description: `Priorité modifiée : ${labelOfPriority[current.priority]} → ${labelOfPriority[patch.priority]}`,
              oldValue: current.priority,
              newValue: patch.priority,
            });
          }

          if (patch.assignedTo !== undefined && patch.assignedTo !== current.assignedTo) {
            history.addHistoryEntry({
              taskId,
              type: "responsable",
              actorEmail,
              description: `Responsable modifié : ${current.assignedTo ?? "Non assigné"} → ${patch.assignedTo ?? "Non assigné"}`,
              oldValue: current.assignedTo,
              newValue: patch.assignedTo,
            });
          }

          if (patch.dueDate !== undefined && patch.dueDate !== current.dueDate) {
            history.addHistoryEntry({
              taskId,
              type: "echeance",
              actorEmail,
              description: `Échéance modifiée : ${formatDateShort(current.dueDate)} → ${formatDateShort(patch.dueDate)}`,
              oldValue: current.dueDate,
              newValue: patch.dueDate,
            });
          }

          return {
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, ...patch } : t
            ),
          };
        }),

      // ✅ Suppression d'une tâche individuelle
      deleteTask: (taskId) => {
        useHistoryStore.getState().clearTaskHistory(taskId);
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
      },

      // ✅ Cascade : à la suppression d'un projet, ses tâches et leur historique disparaissent
      deleteTasksByProject: (projectId) => {
        const projectTaskIds = get()
          .tasks.filter((t) => t.projectId === projectId)
          .map((t) => t.id);
        useHistoryStore.getState().clearProjectHistory(projectTaskIds);
        set((state) => ({
          tasks: state.tasks.filter((t) => t.projectId !== projectId),
        }));
      },
    }),
    {
      name: "mvp-taches",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);