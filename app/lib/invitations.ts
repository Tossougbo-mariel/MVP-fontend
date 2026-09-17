"use client";

import { useAgencyStore } from "@/app/store/agencyStore";
import { useNotificationsStore } from "@/app/store/notificationsStore";
import type { User } from "@/app/store/authStore";

// ✅ Lien de confirmation reçu par e-mail. En mode démo (pas de serveur mail),
// ce lien est copié puis ouvert par la personne invitée.
export function invitationAcceptLink(invitationId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/accepter-invitation?id=${invitationId}`;
}

export type AcceptInvitationResult =
  | { ok: true; agencyId: string; agencyName: string }
  | { ok: false; message: string };

// ✅ Accepte une invitation : ajoute l'utilisateur connecté à l'agence
// (utilisé par la page publique /accepter-invitation et par les notifications).
export function acceptInvitationForUser(
  invitationId: string,
  user: User,
): AcceptInvitationResult {
  const notif = useNotificationsStore.getState();
  const agencyStore = useAgencyStore.getState();

  const invitation = notif.invitations.find((i) => i.id === invitationId);
  if (!invitation) {
    return { ok: false, message: "Cette invitation est introuvable ou a expiré." };
  }
  if (invitation.status !== "pending") {
    return { ok: false, message: "Cette invitation a déjà été traitée." };
  }
  if (invitation.toEmail.toLowerCase() !== user.email.toLowerCase()) {
    return {
      ok: false,
      message: `Cette invitation a été envoyée à ${invitation.toEmail}. Connectez-vous avec ce compte.`,
    };
  }

  const agency = agencyStore.agencies.find((a) => a.id === invitation.agencyId);
  if (!agency) {
    notif.declineInvitation(invitationId);
    return { ok: false, message: "Cette agence n'existe plus." };
  }

  const ok = agencyStore.addMember(invitation.agencyId, {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar ?? null,
    role: agency.settings?.defaultMemberRole ?? "membre",
    status: "actif",
    joinedAt: new Date().toISOString().slice(0, 10),
    taskCount: 0,
  });

  if (ok) {
    notif.acceptInvitation(invitationId);
    return { ok: true, agencyId: invitation.agencyId, agencyName: agency.name };
  }

  notif.declineInvitation(invitationId);
  return { ok: false, message: "Vous êtes déjà membre de cette agence." };
}