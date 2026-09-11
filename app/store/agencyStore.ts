"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./authStore";

// ====== Type d'un membre (agent) d'une agence ======
export type AgencyMember = {
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: "admin" | "membre";
  joinedAt: string;
};

// ====== Type de l'utilisateur dans cette agence ======
export type AgencyRole = "admin" | "membre";

export type Agency = {
  id: string;
  name: string;
  role: AgencyRole; // rôle de l'utilisateur DANS cette agence
  members: AgencyMember[]; // les agents de l'agence
  createdAt: string;
};

// Utilitaire : construit le membre correspondant à l'utilisateur connecté
const memberFromUser = (role: AgencyRole): AgencyMember => {
  const u = useAuthStore.getState().user;
  return {
    email: u?.email ?? "",
    firstName: u?.firstName ?? "",
    lastName: u?.lastName ?? "",
    avatar: u?.avatar ?? null,
    role,
    joinedAt: new Date().toISOString().slice(0, 10),
  };
};

// ✅ Les agences auxquelles l'utilisateur appartient (par email)
export const userAgencies = (agencies: Agency[], email: string) =>
  agencies.filter((a) =>
    (a.members ?? []).some((m) => m.email.toLowerCase() === email.toLowerCase()),
  );

// ✅ Le rôle de l'utilisateur DANS une agence (dérivé de sa fiche membre)
export const userRoleInAgency = (a: Agency, email: string): AgencyRole =>
  (a.members ?? []).find((m) => m.email.toLowerCase() === email.toLowerCase())
    ?.role ?? "membre";

type AgencyState = {
  agencies: Agency[];
  addAgency: (name: string) => Agency; // le créateur devient admin + premier membre
  joinAgencyAsMember: (id: string, name: string) => void;
  addMember: (agencyId: string, member: AgencyMember) => boolean;
  removeMember: (agencyId: string, email: string) => void;
  updateMember: (agencyId: string, email: string, patch: Partial<AgencyMember>) => void;
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
          role: "admin",
          members: creator.email ? [creator] : [],
          createdAt: new Date().toISOString().slice(0, 10),
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
                createdAt: new Date().toISOString().slice(0, 10),
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
        set((state) => ({
          agencies: state.agencies.map((a) =>
            a.id === agencyId
              ? { ...a, members: [...(a.members ?? []), member] }
              : a
          ),
        }));
        return true;
      },

      removeMember: (agencyId, email) =>
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
        })),

      updateMember: (agencyId, email, patch) =>
        set((state) => ({
          agencies: state.agencies.map((a) =>
            a.id === agencyId
              ? {
                  ...a,
                  members: (a.members ?? []).map((m) =>
                    m.email.toLowerCase() === email.toLowerCase()
                      ? { ...m, ...patch }
                      : m
                  ),
                }
              : a
          ),
        })),

      removeAgency: (id) =>
        set((state) => ({ agencies: state.agencies.filter((a) => a.id !== id) })),
    }),
    {
      name: "mvp-agences",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ agencies: state.agencies }),

      // ✅ Migration : les anciennes agences (sans champ `members`)
      // reçoivent automatiquement le créateur connecté comme admin.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const user = useAuthStore.getState().user;
        const me = user
          ? {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar ?? null,
              role: "admin" as const,
              joinedAt: new Date().toISOString().slice(0, 10),
            }
          : null;
        const agencies = state.agencies.map((a) =>
          Array.isArray(a.members) && a.members.length > 0
            ? a
            : { ...a, members: me ? [me] : [] }
        );
        useAgencyStore.setState({ agencies });
      },
    },
  ),
);