"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api, { getApiErrorMessage } from "@/lib/api";
import {
  fetchTwoFactorState,
  isTwoFactorChallenge,
  requestLoginCode,
  resendTwoFactorCode,
  setTwoFactorEnabled,
  verifyLoginCode,
  verifyTwoFactorCode,
  type LoginResponse,
  type TwoFactorChallenge,
} from "@/lib/auth";
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
  /** `false` pour un compte créé via Google : aucun mot de passe à saisir. */
  hasPassword?: boolean;
  createdAt: string;
};

export type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

type LoginResult = { ok: true; error: null } | { ok: false; error: string };
type RegisterResult = { ok: true; error: null } | { ok: false; error: string };

/**
 * `twoFactor` n'est pas une erreur : le mot de passe est bon, il manque
 * simplement le code. L'interface bascule alors sur la saisie du code.
 */
type LoginOutcome =
  | { ok: true; twoFactor: null; error: null }
  | { ok: true; twoFactor: TwoFactorChallenge; error: null }
  | { ok: false; twoFactor: null; error: string };

type OtpResult = { ok: true; message: string; error: null } | { ok: false; message: null; error: string };

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
  login: (email: string, password: string) => Promise<LoginOutcome>;
  requestEmailCode: (email: string) => Promise<OtpResult>;
  loginWithEmailCode: (email: string, code: string) => Promise<LoginResult>;
  verifyTwoFactor: (ticket: string, code: string) => Promise<LoginResult>;
  resendTwoFactor: (ticket: string) => Promise<{ ok: boolean; ticket?: string; error: string | null }>;
  completeGoogleSession: (token: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearAuth: () => void;
  updateUser: (patch: Partial<User>) => Promise<void>;
  twoFactorEnabled: boolean;
  fetchTwoFactor: () => Promise<boolean>;
  toggleTwoFactor: (enabled: boolean, password?: string) => Promise<LoginResult>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      status: "idle",
      twoFactorEnabled: false,

      // POST /api/login — connecte l'utilisateur et stocke le token Sanctum.
      // Si le compte a une double authentification, aucun token n'est encore
      // délivré : on renvoie le défi pour faire saisir le code.
      login: async (email, password) => {
        set({ status: "loading" });
        try {
          const { data } = await api.post<LoginResponse>("/login", { email, password });

          if (isTwoFactorChallenge(data)) {
            set({ status: "guest" });
            return { ok: true, twoFactor: data, error: null };
          }

          set({ user: apiUserToLocalUser(data.user), token: data.token, status: "authenticated" });
          return { ok: true, twoFactor: null, error: null };
        } catch (error) {
          set({ status: "guest" });
          return { ok: false, twoFactor: null, error: getApiErrorMessage(error) };
        }
      },

      // Connexion sans mot de passe : on demande un code à l'API.
      requestEmailCode: async (email) => {
        try {
          const message = await requestLoginCode(email);
          return { ok: true, message, error: null };
        } catch (error) {
          return { ok: false, message: null, error: getApiErrorMessage(error) };
        }
      },

      loginWithEmailCode: async (email, code) => {
        set({ status: "loading" });
        try {
          const session = await verifyLoginCode(email, code);
          set({
            user: apiUserToLocalUser(session.user),
            token: session.token,
            status: "authenticated",
          });
          return { ok: true, error: null };
        } catch (error) {
          set({ status: "guest" });
          return { ok: false, error: getApiErrorMessage(error) };
        }
      },

      // Le ticket n'accorde aucun accès : il est échangé contre un token
      // une fois le code saisi.
      verifyTwoFactor: async (ticket, code) => {
        set({ status: "loading" });
        try {
          const session = await verifyTwoFactorCode(ticket, code);
          set({
            user: apiUserToLocalUser(session.user),
            token: session.token,
            status: "authenticated",
          });
          return { ok: true, error: null };
        } catch (error) {
          set({ status: "guest" });
          return { ok: false, error: getApiErrorMessage(error) };
        }
      },

      resendTwoFactor: async (ticket) => {
        try {
          const challenge = await resendTwoFactorCode(ticket);
          return { ok: true, ticket: challenge.ticket, error: null };
        } catch (error) {
          return { ok: false, error: getApiErrorMessage(error) };
        }
      },

      // Le callback Google renvoie le token dans le fragment de l'URL ; on
      // l'absorbe ici puis on recharge l'utilisateur auprès de l'API.
      completeGoogleSession: async (token) => {
        set({ token, status: "loading" });
        try {
          const { data } = await api.get<ApiUser>("/me");
          set({ user: apiUserToLocalUser(data), token, status: "authenticated" });
          return { ok: true, error: null };
        } catch (error) {
          set({ user: null, token: null, status: "guest" });
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

      fetchTwoFactor: async () => {
        if (!get().token) return false;
        try {
          const enabled = await fetchTwoFactorState();
          set({ twoFactorEnabled: enabled });
          return enabled;
        } catch {
          return get().twoFactorEnabled;
        }
      },

      toggleTwoFactor: async (enabled, password) => {
        try {
          const next = await setTwoFactorEnabled(enabled, password);
          set({ twoFactorEnabled: next });
          return { ok: true, error: null };
        } catch (error) {
          return { ok: false, error: getApiErrorMessage(error) };
        }
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