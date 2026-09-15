"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AgencyRole, Project, ProjectStatus } from "./agencyStore";

// ✅ Projets d'une agence — selon le rôle :
// - admin : tous les projets de l'agence
// - membre : seulement ceux où le membre est assigné (memberIds)
export const getProjectsByAgency = (
  projects: Project[],
  agencyId: string,
  userId: string,
  role: AgencyRole
): Project[] => {
  const scoped = projects.filter((p) => p.agencyId === agencyId);
  if (role === "admin") return scoped;
  return scoped.filter((p) =>
    (p.memberIds ?? []).some(
      (id) => id.toLowerCase() === userId.toLowerCase()
    )
  );
};

// ✅ Un projet par son id
export const getProjectById = (projects: Project[], projectId: string) =>
  projects.find((p) => p.id === projectId);

type CreateProjectData = {
  agencyId: string;
  name: string;
  description: string;
  ownerId: string; // email du responsable
  memberIds: string[]; // emails des membres assignés
  startDate?: string | null;
  dueDate?: string | null;
  status?: ProjectStatus;
};

type ProjectState = {
  projects: Project[];
  createProject: (data: CreateProjectData) => Project;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  addProjectMember: (projectId: string, email: string) => void;
  removeProjectMember: (projectId: string, email: string) => void;
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],

      createProject: (data) => {
        // ✅ Le responsable est TOUJOURS membre du projet, même s'il n'a
        // pas été coché manuellement dans memberIds (logique backend : le
        // créateur est automatiquement ajouté à project_members).
        const memberIds = data.memberIds.some(
          (id) => id.toLowerCase() === data.ownerId.toLowerCase()
        )
          ? data.memberIds
          : [...data.memberIds, data.ownerId];

        const project: Project = {
          id: "prj" + Date.now(),
          agencyId: data.agencyId,
          name: data.name,
          description: data.description,
          status: data.status ?? "a_venir",
          startDate: data.startDate ?? null,
          dueDate: data.dueDate ?? null,
          ownerId: data.ownerId,
          memberIds,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },

      updateProject: (projectId, patch) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const next: Project = { ...p, ...patch };
            // ✅ Invariant : le responsable est TOUJOURS dans memberIds,
            // même si ownerId change par l'édition.
            const memberIds = next.memberIds.some(
              (id) => id.toLowerCase() === next.ownerId.toLowerCase()
            )
              ? next.memberIds
              : [...next.memberIds, next.ownerId];
            return { ...next, memberIds };
          }),
        })),

      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
        })),

      // ✅ Ajout immédiat d'un membre au projet (« ajouter », pas
      // « inviter ») : la personne est déjà membre actif de l'agence,
      // aucun statut « en attente » à ce niveau.
      addProjectMember: (projectId, email) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const exists = (p.memberIds ?? []).some(
              (id) => id.toLowerCase() === email.toLowerCase()
            );
            return exists ? p : { ...p, memberIds: [...p.memberIds, email] };
          }),
        })),

      // ✅ Retrait d'un membre du projet — sauf le responsable,
      // qui reste toujours membre tant qu'il est owner.
      removeProjectMember: (projectId, email) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            if (p.ownerId.toLowerCase() === email.toLowerCase()) return p;
            return {
              ...p,
              memberIds: p.memberIds.filter(
                (id) => id.toLowerCase() !== email.toLowerCase()
              ),
            };
          }),
        })),
    }),
    {
      name: "mvp-projets",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ projects: state.projects }),
    }
  )
);