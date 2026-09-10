"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ====== Type d'une agence (TypeScript) ======
export type AgencyRole = "admin" | "membre";

export type Agency = {
  id: string;
  name: string;
  role: AgencyRole; // rôle de l'utilisateur DANS cette agence
  createdAt: string;
};

type AgencyState = {
  agencies: Agency[];
  addAgency: (name: string) => Agency; // le créateur devient admin
  joinAgencyAsMember: (id: string, name: string) => void;
  removeAgency: (id: string) => void;
};

export const useAgencyStore = create<AgencyState>()(
  persist(
    (set) => ({
      agencies: [],

      addAgency: (name) => {
        const agency: Agency = {
          id: "ag" + Date.now(),
          name,
          role: "admin",
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((state) => ({ agencies: [...state.agencies, agency] }));
        return agency;
      },

      // ✅ CORRIGÉ : Logique plus claire avec commentaire explicite
      joinAgencyAsMember: (id, name) =>
        set((state) => {
          // ✅ Vérifier si l'utilisateur est déjà membre de cette agence
          const alreadyMember = state.agencies.some((a) => a.id === id);
          
          if (alreadyMember) {
            // L'utilisateur est déjà membre, on ne change rien
            console.warn(`[agencyStore] Utilisateur déjà membre de l'agence ${id}`);
            return state;
          }

          // Ajouter comme nouveau membre
          return {
            agencies: [
              ...state.agencies,
              { 
                id, 
                name, 
                role: "membre", 
                createdAt: new Date().toISOString().slice(0, 10),
              },
            ],
          };
        }),

      removeAgency: (id) =>
        set((state) => ({ agencies: state.agencies.filter((a) => a.id !== id) })),
    }),
    {
      name: "mvp-agences",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ agencies: state.agencies }),
    },
  ),
);
