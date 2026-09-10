"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useRegisteredUsersStore } from "./registeredUsersStore";

// ====== Type de l'utilisateur (TypeScript) ======
export type UserRole = "admin" | "membre";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  phone?: string;
  city?: string;
  bio?: string;
  jobTitle?: string;
  createdAt: string;
};

// ✅ Utilisateurs de DÉMO uniquement (se réinitialisent à chaque refresh)
const DEMO_USERS: User[] = [
  {
    id: "u1",
    firstName: "Jean",
    lastName: "Dupont",
    email: "admin@demo.com",
    role: "admin",
    avatar: null,
    createdAt: "2026-01-10",
  },
  {
    id: "u2",
    firstName: "Marie",
    lastName: "Curie",
    email: "membre@demo.com",
    role: "membre",
    avatar: null,
    createdAt: "2026-03-22",
  },
];

export const MOCK_PASSWORD = "secret123";

type AuthState = {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (data: { 
    firstName: string; 
    lastName: string; 
    email: string;
    password: string;
    avatar?: string | null;
  }) => boolean | string;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      // ✅ CORRIGÉ : Vérifier d'abord les users de démo, puis les users enregistrés
      login: (email, password) => {
        const trimmedEmail = email.toLowerCase().trim();

        // 1️⃣ Vérifier d'abord les users de démo (avec le password de démo)
        const demoUser = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === trimmedEmail
        );
        
        if (demoUser && password === MOCK_PASSWORD) {
          set({ user: demoUser });
          console.log("[authStore] Connexion avec compte démo:", email);
          return true;
        }

        // 2️⃣ ✅ Vérifier les utilisateurs enregistrés (depuis le localStorage)
        const registeredUsers = useRegisteredUsersStore.getState();
        const registeredUser = registeredUsers.findUser(email);

        if (registeredUser && registeredUser.password === password) {
          // Créer un objet User à partir du RegisteredUser
          const user: User = {
            id: `u_${Date.now()}`,
            firstName: registeredUser.firstName,
            lastName: registeredUser.lastName,
            email: registeredUser.email,
            role: "membre",
            avatar: registeredUser.avatar ?? null,
            createdAt: registeredUser.createdAt,
          };
          set({ user });
          console.log("[authStore] Connexion avec utilisateur enregistré:", email);
          return true;
        }

        console.log("[authStore] Connexion échouée (identifiants incorrects):", email);
        return false;
      },

      // ✅ CORRIGÉ : Accepter le password, utiliser le registeredUsersStore
      // et NE PAS connecter l'utilisateur après l'inscription (comme super-agent :
      // l'utilisateur doit ensuite se connecter avec les identifiants enregistrés)
      register: ({ firstName, lastName, email, password, avatar = null }) => {
        // Validation du password
        if (password.length < 6) {
          return "Le mot de passe doit contenir au moins 6 caractères";
        }

        // ✅ Utiliser le store des users enregistrés pour persister
        const registeredUsers = useRegisteredUsersStore.getState();
        const result = registeredUsers.registerUser({
          email,
          password,
          firstName,
          lastName,
          avatar: avatar ?? null,
          createdAt: new Date().toISOString().slice(0, 10),
        });

        if (result !== true) {
          return result; // Message d'erreur (email déjà utilisé, etc.)
        }

        // ❌ PAS de set({ user }) : après l'inscription l'utilisateur n'est PAS
        // connecté, il doit se rendre sur la page de connexion.
        console.log("[authStore] Nouvel utilisateur enregistré (pas de connexion auto):", email);
        return true;
      },

      logout: () => {
        console.log("[authStore] Déconnexion");
        set({ user: null });
      },

      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : null,
        })),
    }),
    {
      name: "mvp-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
