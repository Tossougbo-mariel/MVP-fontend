"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ====== Type pour les utilisateurs enregistrés ======
export type RegisteredUser = {
  email: string;
  password: string; // ⚠️ À HASHER en production!
  firstName: string;
  lastName: string;
  avatar?: string | null;
  createdAt: string;
};

type RegisteredUsersState = {
  users: RegisteredUser[];
  registerUser: (user: RegisteredUser) => boolean | string;
  findUser: (email: string) => RegisteredUser | undefined;
  userExists: (email: string) => boolean;
};

export const useRegisteredUsersStore = create<RegisteredUsersState>()(
  persist(
    (set, get) => ({
      users: [],

      // ✅ Enregistrer un nouvel utilisateur
      registerUser: (user) => {
        const state = get();
        
        // Vérifier si l'email existe déjà
        if (state.userExists(user.email)) {
          return "Cet email est déjà utilisé";
        }

        // Validation du password
        if (user.password.length < 6) {
          return "Le mot de passe doit contenir au moins 6 caractères";
        }

        // ✅ Ajouter l'utilisateur à la liste persistée (localStorage)
        set((s) => ({ users: [...s.users, user] }));
        console.log("[registeredUsersStore] Nouvel utilisateur enregistré:", user.email);
        return true;
      },

      // ✅ Chercher un utilisateur par email
      findUser: (email) => {
        return get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
      },

      // ✅ Vérifier si un email est déjà utilisé
      userExists: (email) => {
        return get().users.some(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
      },
    }),
    {
      name: "mvp-registered-users",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ users: state.users }),
    },
  ),
);