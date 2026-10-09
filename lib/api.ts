import axios from "axios";

export const AUTH_STORAGE_KEY = "mvp-auth";

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? parsed?.token ?? null;
  } catch {
    return null;
  }
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url ?? "";
    // Un code erroné ou un ticket 2FA expiré renvoie 401 sans que la session
    // soit pour autant invalide : il ne faut pas effacer le token dans ces cas.
    const isAuthAttempt =
      url.includes("/login") ||
      url.includes("/register") ||
      url.includes("/auth/otp/verify") ||
      url.includes("/auth/two-factor/verify") ||
      url.includes("/auth/two-factor/resend");

    if (status === 401 && typeof window !== "undefined" && !isAuthAttempt) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      if (window.location.pathname !== "/connexion") {
        window.location.assign(window.location.origin + "/connexion");
      }
    }
    return Promise.reject(error);
  },
);

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
      errors?: Record<string, string[] | string>;
    };
  };
};

export const getApiErrorMessage = (error: unknown): string => {
  const data = (error as ApiErrorShape)?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first)) return first[0];
    if (typeof first === "string") return first;
  }
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  const status = (error as ApiErrorShape)?.response?.status;
  if (typeof status === "number" && status >= 500) {
    return "Le serveur ne répond pas. Réessayez plus tard.";
  }
  return "Une erreur est survenue.";
};

export default api;