"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ====== Types ======
export type TaskPriority = "basse" | "moyenne" | "haute" | "critique";

export type TaskStatus = "a_faire" | "en_cours" | "terminee";

export type Task = {
  id: string;
  title: string;
  description: string;
  agencyId: string;
  projectId: string;
  projectName: string;
  assigneeEmail: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string; // ISO date
  createdAt: string;
  completedAt?: string;
};

// ====== Dates démo ======
const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const day = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return fmt(d);
};

// ====== Données démo (seed vide — rempli par seedTasks) ======
const SEED_TASKS: Task[] = [];

type TasksState = {
  tasks: Task[];
  seedTasks: (agencyId: string, members: { email: string }[]) => void;
  tasksForAgency: (agencyId: string) => Task[];
  tasksForUser: (agencyId: string, email: string) => Task[];
  overdueTasksForAgency: (agencyId: string) => Task[];
};

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: SEED_TASKS,

      // ✅ Seed des tâches démo pour une agence (idempotent : ne recrée pas si déjà présent)
      seedTasks: (agencyId, members) => {
        const existing = get().tasks.filter((t) => t.agencyId === agencyId);
        if (existing.length > 0) return;

        const emails = members.map((m) => m.email);
        if (emails.length === 0) return;

        const e0 = emails[0];
        const e1 = emails.length > 1 ? emails[1] : emails[0];

        const seed: Task[] = [
          {
            id: "task-demo-1",
            title: "Refonte page d'accueil",
            description: "Mettre à jour la landing page avec le nouveau design.",
            agencyId,
            projectId: "proj-demo-1",
            projectName: "Site Vitrine",
            assigneeEmail: e0,
            status: "en_cours",
            priority: "haute",
            deadline: day(2),
            createdAt: day(-5),
          },
          {
            id: "task-demo-2",
            title: "Rédiger charte graphique",
            description: "Documenter les couleurs, polices et components.",
            agencyId,
            projectId: "proj-demo-1",
            projectName: "Site Vitrine",
            assigneeEmail: e1,
            status: "a_faire",
            priority: "moyenne",
            deadline: day(5),
            createdAt: day(-3),
          },
          {
            id: "task-demo-3",
            title: "Corriger bug formulaire contact",
            description: "Le formulaire ne valide pas les champs vides.",
            agencyId,
            projectId: "proj-demo-2",
            projectName: "App Mobile",
            assigneeEmail: e0,
            status: "a_faire",
            priority: "critique",
            deadline: day(-1), // en retard
            createdAt: day(-10),
          },
          {
            id: "task-demo-4",
            title: "Intégrer API paiement",
            description: "Brancher Stripe sur le checkout.",
            agencyId,
            projectId: "proj-demo-2",
            projectName: "App Mobile",
            assigneeEmail: e0,
            status: "a_faire",
            priority: "haute",
            deadline: day(1), // échéance proche
            createdAt: day(-2),
          },
          {
            id: "task-demo-5",
            title: "Setup CI/CD",
            description: "Configurer GitHub Actions pour le déploiement auto.",
            agencyId,
            projectId: "proj-demo-3",
            projectName: "Outils Interne",
            assigneeEmail: e1,
            status: "terminee",
            priority: "basse",
            deadline: day(-2),
            createdAt: day(-14),
            completedAt: day(-3),
          },
        ];

        set((s) => ({ tasks: [...s.tasks, ...seed] }));
      },

      tasksForAgency: (agencyId) =>
        get().tasks.filter((t) => t.agencyId === agencyId),

      tasksForUser: (agencyId, email) =>
        get().tasks.filter(
          (t) =>
            t.agencyId === agencyId &&
            t.assigneeEmail.toLowerCase() === email.toLowerCase(),
        ),

      overdueTasksForAgency: (agencyId) =>
        get().tasks.filter(
          (t) =>
            t.agencyId === agencyId &&
            t.status !== "terminee" &&
            t.deadline < fmt(new Date()),
        ),
    }),
    {
      name: "mvp-tasks",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tasks: state.tasks }),
    },
  ),
);
