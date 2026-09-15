"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ✅ Type d'événement de l'historique d'une tâche
export type TaskHistoryType =
  | "creation"
  | "statut"
  | "responsable"
  | "priorite"
  | "echeance"
  | "terminee";

// ✅ Entrée d'historique rattachée à une tâche
export type TaskHistoryEntry = {
  id: string;
  taskId: string;
  type: TaskHistoryType;
  actorEmail: string; // email de l'auteur de l'action
  description: string; // libellé affiché
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string; // horodatage ISO
};

// ✅ Historique d'une tâche (tri : plus anciens en premier)
export const getHistoryByTask = (history: TaskHistoryEntry[], taskId: string): TaskHistoryEntry[] =>
  history
    .filter((h) => h.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

type HistoryState = {
  history: TaskHistoryEntry[];
  addHistoryEntry: (data: {
    taskId: string;
    type: TaskHistoryType;
    actorEmail: string;
    description: string;
    oldValue?: string | null;
    newValue?: string | null;
  }) => TaskHistoryEntry;
  clearTaskHistory: (taskId: string) => void;
  clearProjectHistory: (taskIds: string[]) => void;
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [] as TaskHistoryEntry[],

      // ✅ Ajout d'une entrée d'historique
      addHistoryEntry: (data) => {
        const entry: TaskHistoryEntry = {
          id: "historique" + Date.now() + Math.floor(Math.random() * 1000),
          taskId: data.taskId,
          type: data.type,
          actorEmail: data.actorEmail,
          description: data.description,
          oldValue: data.oldValue ?? null,
          newValue: data.newValue ?? null,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ history: [...state.history, entry] }));
        return entry;
      },

      // ✅ Cascade : à la suppression d'une tâche, son historique disparaît
      clearTaskHistory: (taskId) =>
        set((state) => ({
          history: state.history.filter((h) => h.taskId !== taskId),
        })),

      // ✅ Cascade : à la suppression d'un projet, l'historique de ses tâches disparaît
      clearProjectHistory: (taskIds) =>
        set((state) => ({
          history: state.history.filter((h) => !taskIds.includes(h.taskId)),
        })),
    }),
    {
      name: "mvp-historique",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ history: state.history }),
    }
  )
);