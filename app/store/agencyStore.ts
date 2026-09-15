"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./authStore";

// ====== Type d'un membre (agent) d'une agence ======
export type AgencyMemberRole = "admin" | "membre";
export type AgencyMember = {
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: AgencyMemberRole;
  status: "actif" | "inactif";
  joinedAt: string;
  taskCount: number;
  color?: string;
};

// ====== Palette de couleurs harmonisées avec le bleu ======
// Chaque membre reçoit une couleur stable pour son avatar et son accent.
// Palette resserrée autour de la famille bleu/indigo/sarcelle pour rester
// cohérente avec la couleur dominante de la plateforme, tout en gardant
// assez de variation pour distinguer chaque agent au premier coup d'œil.
export const MEMBER_COLORS = [
  "#5B5BD6", // indigo
  "#0D9488", // sarcelle
  "#7C3AED", // violet profond
  "#0EA5A0", // turquoise
  "#0369A1", // bleu océan
  "#8B5CF6", // violet clair
  "#0891B2", // cyan ardoise
  "#4C6EF5", // bleu-indigo
];

// ====== Couleur dédiée au propriétaire (accent distinct, harmonisé au bleu) ======
export const OWNER_COLOR = "#C7961A";

const pickMemberColor = (existing: (string | undefined)[]): string => {
  const used = new Set(
    (existing ?? []).filter(Boolean).map((c) => c!.toLowerCase()),
  );
  const free = MEMBER_COLORS.find((c) => !used.has(c.toLowerCase()));
  return free ?? MEMBER_COLORS[(existing ?? []).length % MEMBER_COLORS.length];
};

// ====== Type du rôle de l'utilisateur dans cette agence ======
export type AgencyRole = "owner" | "admin" | "membre";

// ====== Réglages d'une agence (page Paramètres) ======
export type AgencySettings = {
  whoCanInvite: "owner" | "admin" | "all";
  whoCanCreateProjects: "owner" | "admin" | "all";
  defaultTaskView: "grid" | "list" | "kanban";
  agencyName: string;
  defaultMemberRole: AgencyMemberRole;
  emailNotifications: boolean;
};

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  whoCanInvite: "owner",
  whoCanCreateProjects: "admin",
  defaultTaskView: "grid",
  agencyName: "",
  defaultMemberRole: "membre",
  emailNotifications: true,
};

export type Agency = {
  id: string;
  name: string;
  role: AgencyRole;
  members: AgencyMember[];
  createdBy: string;
  createdAt: string;
  settings: AgencySettings;
};

// ====== Type d'un projet appartenant à une agence ======
export type ProjectStatus = "a_venir" | "en_cours" | "termine" | "archive";

export type Project = {
  id: string;
  agencyId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  ownerId: string; // email du responsable
  memberIds: string[]; // emails des membres assignés
  createdAt: string;
  wallpaper?: string | null; // fond d'écran du Kanban (optionnel)
};

// ====== Type d'une tâche appartenant à un projet ======
export type TaskStatus = "a_faire" | "en_cours" | "en_revision" | "terminee";
export type TaskPriority = "basse" | "moyenne" | "haute" | "urgente";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  assignedTo: string | null; // email du membre assigné
  createdBy: string; // email du créateur
  dueDate: string | null;
  createdAt: string;
};

// Utilitaire : construit le membre correspondant à l'utilisateur connecté
const memberFromUser = (role: AgencyMemberRole): AgencyMember => {
  const u = useAuthStore.getState().user;
  return {
    email: u?.email ?? "",
    firstName: u?.firstName ?? "",
    lastName: u?.lastName ?? "",
    avatar: u?.avatar ?? null,
    role,
    status: "actif",
    joinedAt: new Date().toISOString().slice(0, 10),
    taskCount: 0,
    color: OWNER_COLOR,
  };
};

export const userAgencies = (agencies: Agency[], email: string) =>
  agencies.filter((a) =>
    (a.members ?? []).some((m) => m.email.toLowerCase() === email.toLowerCase()),
  );

export const isAgencyOwner = (a: Agency, email: string): boolean =>
  Boolean(a.createdBy) && a.createdBy.toLowerCase() === email.toLowerCase();

export const userRoleInAgency = (a: Agency, email: string): AgencyRole => {
  if (isAgencyOwner(a, email)) return "owner";
  return (a.members ?? []).find((m) => m.email.toLowerCase() === email.toLowerCase())
    ?.role ?? "membre";
};

// ====== Droits de la plateforme (basés sur la fiche des rôles) ======
// Les droits listés pour l'administrateur :
// invite, manageUsers, createProjects, deleteProjects, createTasks,
// modifyTasks, assignTasks, viewAllTasks, changeStatuses,
// viewDashboard, viewHistory.
// Le propriétaire possède TOUS les droits (il regroupe owner + admin).
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

export const hasRight = (agency: Agency | null | undefined, email: string, right: TaskPlatformRight): boolean => {
  if (!agency) return false;
  const role = userRoleInAgency(agency, email);
  if (role === "owner") return true;
  if (role !== "admin") return false;
  if (right === "invite") {
    const who = agency.settings?.whoCanInvite ?? "owner";
    return who === "admin" || who === "all";
  }
  if (right === "createProjects") {
    const who = agency.settings?.whoCanCreateProjects ?? "admin";
    return who === "admin" || who === "all";
  }
  return true;
};

type AgencyState = {
  agencies: Agency[];
  addAgency: (name: string) => Agency;
  joinAgencyAsMember: (id: string, name: string) => void;
  addMember: (agencyId: string, member: AgencyMember) => boolean;
  removeMember: (agencyId: string, email: string) => void;
  updateMember: (agencyId: string, email: string, patch: Partial<AgencyMember>) => void;
  updateAgencySettings: (agencyId: string, patch: Partial<AgencySettings>) => void;
  removeAgency: (id: string) => void;
};

export const useAgencyStore = create<AgencyState>()(
  persist(
    (set, get) => ({
      agencies: [],

      addAgency: (name) => {
        const creator = memberFromUser("admin");
        const agency: Agency = {
          id: "ag" + Date.now(),
          name,
          role: "owner",
          members: creator.email ? [creator] : [],
          createdBy: creator.email,
          createdAt: new Date().toISOString().slice(0, 10),
          settings: { ...DEFAULT_AGENCY_SETTINGS, agencyName: name },
        };
        set((state) => ({ agencies: [...state.agencies, agency] }));
        return agency;
      },

      joinAgencyAsMember: (id, name) =>
        set((state) => {
          const alreadyMember = state.agencies.some((a) => a.id === id);
          if (alreadyMember) {
            console.warn(`[agencyStore] Utilisateur déjà membre de l'agence ${id}`);
            return state;
          }
          const me = memberFromUser("membre");
          return {
            agencies: [
              ...state.agencies,
              {
                id,
                name,
                role: "membre",
                members: me.email ? [me] : [],
                createdBy: me.email ?? "",
                createdAt: new Date().toISOString().slice(0, 10),
                settings: { ...DEFAULT_AGENCY_SETTINGS, agencyName: name },
              },
            ],
          };
        }),

      addMember: (agencyId, member) => {
        const agency = get().agencies.find((a) => a.id === agencyId);
        if (!agency) return false;
        const exists = (agency.members ?? []).some(
          (m) => m.email.toLowerCase() === member.email.toLowerCase()
        );
        if (exists) return false;
        // ✅ Chaque nouveau membre prend une couleur non encore utilisée
        const color = pickMemberColor((agency.members ?? []).map((m) => m.color));
        set((state) => ({
          agencies: state.agencies.map((a) =>
            a.id === agencyId
              ? { ...a, members: [...(a.members ?? []), { ...member, color }] }
              : a
          ),
        }));
        return true;
      },

      removeMember: (agencyId, email) => {
        const agency = get().agencies.find((a) => a.id === agencyId);
        const isOwner = agency &&
          String(agency.createdBy ?? "").toLowerCase() === String(email).toLowerCase();
        if (isOwner) {
          console.warn("[agencyStore] Le propriétaire d'une agence ne peut pas être supprimé.");
          return;
        }
        set((state) => ({
          agencies: state.agencies.map((a) =>
            a.id === agencyId
              ? {
                  ...a,
                  members: (a.members ?? []).filter(
                    (m) => m.email.toLowerCase() !== email.toLowerCase()
                  ),
                }
              : a
          ),
        }));
      },

      updateMember: (agencyId, email, patch) => {
        const agency = get().agencies.find((a) => a.id === agencyId);
        const isOwner = agency &&
          String(agency.createdBy ?? "").toLowerCase() === String(email).toLowerCase();
        set((state) => ({
          agencies: state.agencies.map((a) =>
            a.id === agencyId
              ? {
                  ...a,
                  members: (a.members ?? []).map((m) => {
                    if (m.email.toLowerCase() !== email.toLowerCase()) return m;
                    if (isOwner) {
                      return {
                        ...m,
                        ...patch,
                        role: "admin" as const,
                        status: "actif" as const,
                      };
                    }
                    return { ...m, ...patch };
                  }),
                }
              : a
          ),
        }));
      },

      updateAgencySettings: (agencyId, patch) =>
        set((state) => ({
          agencies: state.agencies.map((a) =>
            a.id === agencyId
              ? {
                  ...a,
                  name: patch.agencyName !== undefined ? patch.agencyName : a.name,
                  settings: { ...a.settings, ...patch },
                }
              : a,
          ),
        })),

      removeAgency: (id) =>
        set((state) => ({ agencies: state.agencies.filter((a) => a.id !== id) })),
    }),
    {
      name: "mvp-agences",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ agencies: state.agencies.map(a => ({ ...a, settings: a.settings })) }),

      onRehydrateStorage: () => (state) => {
        if (!state || !Array.isArray(state.agencies)) return;
        const user = useAuthStore.getState().user;
        const me = user
          ? {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar ?? null,
              role: "admin" as const,
              status: "actif" as const,
              joinedAt: new Date().toISOString().slice(0, 10),
              taskCount: 0,
              color: MEMBER_COLORS[0],
            }
          : null;

        // ---- 1) Dédoublonner par id : garder la copie avec createdBy, fusionner les membres ----
        const merged = new Map<string, Agency>();
        for (const a of state.agencies) {
          const existing = merged.get(a.id);
          if (!existing) {
            merged.set(a.id, { ...a, members: Array.isArray(a.members) ? a.members : [] });
            continue;
          }
          let base: Agency = existing;
          if (!existing.createdBy && a.createdBy) {
            base = { ...existing, createdBy: a.createdBy };
          }
          const members = [...base.members];
          for (const m of a.members ?? []) {
            if (!members.some((x) => x.email.toLowerCase() === m.email.toLowerCase())) {
              members.push(m);
            }
          }
          merged.set(a.id, { ...base, members });
        }

        const agencies = [...merged.values()].map((a) => {
          // ---- 2) createdBy ne doit JAMAIS être vide ----
          let createdBy = String(a.createdBy ?? "").trim();
          if (!createdBy) {
            createdBy = a.members?.find((m) => m.role === "admin")?.email ?? "";
          }

          // ---- 3) Le propriétaire est TOUJOURS membre, en admin + actif ----
          let members = (Array.isArray(a.members) ? a.members : []).map((m) => ({
            ...m,
            taskCount: typeof m.taskCount === "number" ? m.taskCount : 0,
          }));
          if (createdBy && !members.some((m) => m.email.toLowerCase() === createdBy.toLowerCase())) {
            members.unshift({
              email: createdBy,
              firstName: createdBy,
              lastName: "",
              avatar: null,
              role: "admin" as const,
              status: "actif" as const,
              joinedAt: a.createdAt ?? new Date().toISOString().slice(0, 10),
              taskCount: 0,
              color: OWNER_COLOR,
            });
          }
          members = members.map((m) =>
            m.email.toLowerCase() === createdBy.toLowerCase()
              ? {
                  ...m,
                  role: "admin" as const,
                  status: "actif" as const,
                  color: OWNER_COLOR,
                }
              : m
          );
          if (members.length === 0 && me) members = [me];

          // ---- 4) Couleur d'accent : valide + unique autant que possible ----
          const usedColors: string[] = [];
          members = members.map((m) => {
            const valid =
              m.color &&
              (m.color.toLowerCase() === OWNER_COLOR.toLowerCase() ||
                MEMBER_COLORS.some((c) => c.toLowerCase() === m.color!.toLowerCase()));
            const color = valid ? m.color! : pickMemberColor(usedColors);
            usedColors.push(color);
            return { ...m, color };
          });

          // ---- 5) Role dérivé du point de vue de l'utilisateur connecté ----
          const isViewerOwner = me && createdBy && createdBy.toLowerCase() === me.email.toLowerCase();
          return {
            ...a,
            createdBy,
            settings: { ...DEFAULT_AGENCY_SETTINGS, ...(a.settings ?? {}), agencyName: a.name },
            role: isViewerOwner ? "owner" as const : "membre" as const,
            members,
          };
        });
        useAgencyStore.setState({ agencies });
      },
    },
  ),
);

// ✅ CORRECTIF : quand un utilisateur modifie son prénom, nom ou avatar
// depuis son profil (authStore.updateUser), on répercute ces infos dans
// la fiche membre de CHAQUE agence à laquelle il appartient.
useAuthStore.subscribe((state, prevState) => {
  const u = state.user;
  const prevU = prevState.user;
  if (!u || !prevU || u.email !== prevU.email) return;
  if (u.firstName === prevU.firstName && u.lastName === prevU.lastName && u.avatar === prevU.avatar) {
    return;
  }
  useAgencyStore.setState((s) => ({
    agencies: s.agencies.map((a) => ({
      ...a,
      members: (a.members ?? []).map((m) =>
        m.email.toLowerCase() === u.email.toLowerCase()
          ? { ...m, firstName: u.firstName, lastName: u.lastName, avatar: u.avatar }
          : m,
      ),
    })),
  }));
});