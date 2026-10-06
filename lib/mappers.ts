import type { User } from "@/app/store/authStore";

export type ApiUser = {
  id: number | string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar: string | null;
  phone: string | null;
  city: string | null;
  bio: string | null;
  job_title: string | null;
  theme_color: string | null;
  status: string;
  /** Présent quand l'API le renvoie : un compte Google n'a pas de mot de passe. */
  has_password?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
};

export const apiUserToLocalUser = (u: ApiUser): User => {
  const fallback = splitName(u.name ?? "");
  return {
    id: Number(u.id),
    firstName: u.first_name ?? fallback.firstName,
    lastName: u.last_name ?? fallback.lastName,
    email: u.email,
    avatar: u.avatar ?? null,
    phone: u.phone ?? undefined,
    city: u.city ?? undefined,
    bio: u.bio ?? undefined,
    jobTitle: u.job_title ?? undefined,
    // Par défaut `true` : si l'API ne le dit pas (anciennes réponses), on ne
    // doit pas faire croire à l'utilisateur qu'il n'a pas de mot de passe.
    hasPassword: u.has_password ?? true,
    themeColor: u.theme_color ?? undefined,
    createdAt: u.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  };
};