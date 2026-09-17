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
    if (
      status === 401 &&
      typeof window !== "undefined" &&
      !url.includes("/login") &&
      !url.includes("/register")
    ) {
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
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
};

export const getApiErrorMessage = (error: unknown): string => {
  const data = (error as ApiErrorShape)?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0]?.[0];
    if (first) return first;
  }
  return data?.message ?? "Une erreur est survenue.";
};

export default api;