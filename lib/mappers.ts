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
    role: "membre",
    avatar: u.avatar ?? null,
    phone: u.phone ?? undefined,
    city: u.city ?? undefined,
    bio: u.bio ?? undefined,
    jobTitle: u.job_title ?? undefined,
    themeColor: u.theme_color ?? undefined,
    createdAt: u.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  };
};