"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api, { getApiErrorMessage } from "@/lib/api";
import { apiUserToLocalUser, type ApiUser } from "@/lib/mappers";

// ====== Type de l'utilisateur (TypeScript) ======
export type UserRole = "admin" | "membre";

export type User = {
  id: number;
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

export type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

type LoginResult = { ok: true; error: null } | { ok: false; error: string };
type RegisterResult = { ok: true; error: null } | { ok: false; error: string };

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatar?: string | null;
};

type AuthState = {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearAuth: () => void;
  updateUser: (patch: Partial<User>) => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      status: "idle",

      // POST /api/login — connecte l'utilisateur et stocke le token Sanctum
      login: async (email, password) => {
        set({ status: "loading" });
        try {
          const { data } = await api.post("/login", { email, password });
          const { token, user } = data as { token: string; user: ApiUser };
          set({
            user: apiUserToLocalUser(user),
            token,
            status: "authenticated",
          });
          console.log("[authStore] Connexion réussie:", email);
          return { ok: true, error: null };
        } catch (error) {
          set({ status: "guest" });
          return { ok: false, error: getApiErrorMessage(error) };
        }
      },

      // POST /api/register — crée le compte SANS connexion automatique
      // (UX conservée : l'utilisateur doit ensuite se connecter).
      register: async ({ firstName, lastName, email, password, avatar }) => {
        try {
          await api.post("/register", {
            first_name: firstName,
            last_name: lastName,
            email,
            password,
            password_confirmation: password,
            avatar: avatar ?? null,
          });
          console.log("[authStore] Nouvel utilisateur enregistré:", email);
          return { ok: true, error: null };
        } catch (error) {
          return { ok: false, error: getApiErrorMessage(error) };
        }
      },

      // POST /api/logout — révoque le token côté serveur puis déconnecte localement
      logout: async () => {
        const { token } = get();
        if (token) {
          try {
            await api.post("/logout");
          } catch {
            // Même si l'API échoue, on déconnecte localement
          }
        }
        console.log("[authStore] Déconnexion");
        set({ user: null, token: null, status: "guest" });
      },

      // GET /api/me — réhydrate le user au démarrage et valide le token
      fetchMe: async () => {
        if (!get().token) {
          set({ user: null, token: null, status: "guest" });
          return;
        }
        set({ status: "loading" });
        try {
          const { data } = await api.get<ApiUser>("/me");
          set({ user: apiUserToLocalUser(data), status: "authenticated" });
        } catch {
          // Token invalide/expiré → session réinitialisée
          set({ user: null, token: null, status: "guest" });
        }
      },

      clearAuth: () => {
        set({ user: null, token: null, status: "guest" });
      },

      // PUT /api/me — met à jour le profil dans la base et rafraîchit l'état local
      updateUser: async (patch) => {
        const prev = get().user;
        if (!prev) return;
        const merged = { ...prev, ...patch };
        try {
          const { data } = await api.put<ApiUser>("/me", {
            first_name: merged.firstName,
            last_name: merged.lastName,
            email: merged.email,
            phone: merged.phone ?? null,
            city: merged.city ?? null,
            bio: merged.bio ?? null,
            job_title: merged.jobTitle ?? null,
            ...(patch.avatar !== undefined ? { avatar: patch.avatar } : {}),
          });
          set({ user: apiUserToLocalUser(data) });
        } catch (error) {
          set({ user: prev });
          throw error;
        }
      },
    }),
    {
      name: "mvp-auth",
      version: 1,
      partialize: (state) => ({ user: state.user, token: state.token, status: state.status }),
      migrate: (persisted) => {
        const state = persisted as { user?: User | null };
        if (state.user && typeof state.user.id === "string") {
          return { ...state, user: { ...state.user, id: Number(state.user.id) } };
        }
        return state;
      },
    },
  ),
);