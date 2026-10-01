// ============================================================
// Authentification : mot de passe, code par email, second
// facteur et connexion Google.
// ============================================================
import { api } from "./api";
import type { ApiUser } from "./mappers";

/** Réponse d'une connexion réussie (mot de passe ou code). */
export type AuthSession = {
  token: string;
  user: ApiUser;
};

/**
 * Le mot de passe est correct mais un second facteur est attendu.
 *
 * Aucun token n'est encore délivré : le `ticket` ne sert qu'à échanger un
 * code contre une session, et expire au bout de quelques minutes.
 */
export type TwoFactorChallenge = {
  two_factor_required: true;
  ticket: string;
  expires_in: number;
};

export type LoginResponse = AuthSession | TwoFactorChallenge;

export const isTwoFactorChallenge = (
  data: unknown,
): data is TwoFactorChallenge =>
  Boolean(data && typeof data === "object" && (data as TwoFactorChallenge).two_factor_required);

export const googleAuthUrl = (): string => {
  // L'URL est sur le backend : elle n'est jamais préfixée par /api.
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/?$/, "");
  return `${base || ""}/auth/google/redirect`;
};

/** Codes d'erreur renvoyés par le callback Google. */
export const GOOGLE_ERRORS: Record<string, string> = {
  email_deja_utilise:
    "Un compte existe déjà avec cette adresse. Connectez-vous avec votre mot de passe ou votre code par email.",
  google_email_absent:
    "Votre compte Google ne partage pas d'adresse e-mail : impossible de créer un compte.",
  google_echec: "La connexion avec Google a échoué. Réessayez.",
};

export const messageForGoogleError = (code: string | null): string | null => {
  if (!code) return null;
  return GOOGLE_ERRORS[code] ?? "La connexion avec Google a échoué.";
};

// ---------- Connexion par code email ----------

/**
 * Demande un code de connexion.
 *
 * Le serveur répond 202 dans tous les cas, que le compte existe ou non : le
 * frontend ne peut donc rien afficher qui permettrait de deviner un email.
 */
export const requestLoginCode = async (email: string): Promise<string> => {
  const { data } = await api.post<{ message: string }>("/auth/otp/request", { email });
  return data.message;
};

export const verifyLoginCode = async (email: string, code: string): Promise<AuthSession> => {
  const { data } = await api.post<AuthSession>("/auth/otp/verify", { email, code });
  return data;
};

// ---------- Second facteur ----------

export const verifyTwoFactorCode = async (
  ticket: string,
  code: string,
): Promise<AuthSession> => {
  const { data } = await api.post<AuthSession>("/auth/two-factor/verify", { ticket, code });
  return data;
};

/** Renvoie un code et un nouveau ticket : l'ancien devient inutilisable. */
export const resendTwoFactorCode = async (ticket: string): Promise<TwoFactorChallenge> => {
  const { data } = await api.post<TwoFactorChallenge>("/auth/two-factor/resend", { ticket });
  return data;
};

export const fetchTwoFactorState = async (): Promise<boolean> => {
  const { data } = await api.get<{ enabled: boolean }>("/auth/two-factor");
  return Boolean(data.enabled);
};

/**
 * Active ou désactive la double authentification.
 *
 * Le mot de passe n'est exigé que pour l'activation, et seulement s'il en
 * existe un : un compte créé via Google s'authentifie déjà par Google.
 */
export const setTwoFactorEnabled = async (
  enabled: boolean,
  password?: string,
): Promise<boolean> => {
  const { data } = await api.put<{ enabled: boolean }>("/auth/two-factor", {
    enabled,
    ...(password ? { password } : {}),
  });
  return Boolean(data.enabled);
};
