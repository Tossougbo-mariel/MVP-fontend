"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ====== Type d'une invitation à rejoindre une agence ======
export type InvitationStatus = "pending" | "accepted" | "declined";

export type Invitation = {
  id: string;
  agencyId: string;
  agencyName: string;
  toEmail: string; // destinataire (l'invité)
  fromEmail: string; // inviteur (l'admin qui a envoyé)
  status: InvitationStatus;
  createdAt: string;
};

type NotificationsState = {
  invitations: Invitation[];
  sendInvitation: (data: {
    agencyId: string;
    agencyName: string;
    toEmail: string;
    fromEmail: string;
  }) => boolean;
  acceptInvitation: (id: string) => void;
  declineInvitation: (id: string) => void;
  pendingFor: (email: string) => Invitation[];
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      invitations: [],

      // Envoie une invitation (aucune copie en double tant qu'elle est inactive ou déclinée)
      sendInvitation: ({ agencyId, agencyName, toEmail, fromEmail }) => {
        const dup = get().invitations.some(
          (i) =>
            i.agencyId === agencyId &&
            i.toEmail.toLowerCase() === toEmail.toLowerCase() &&
            i.status !== "declined",
        );
        if (dup) return false;
        const invitation: Invitation = {
          id: "inv" + Date.now(),
          agencyId,
          agencyName,
          toEmail,
          fromEmail,
          status: "pending",
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((s) => ({ invitations: [invitation, ...s.invitations] }));
        return true;
      },

      acceptInvitation: (id) =>
        set((s) => ({
          invitations: s.invitations.map((i) =>
            i.id === id ? { ...i, status: "accepted" } : i,
          ),
        })),

      declineInvitation: (id) =>
        set((s) => ({
          invitations: s.invitations.map((i) =>
            i.id === id ? { ...i, status: "declined" } : i,
          ),
        })),

      pendingFor: (email) =>
        get().invitations.filter(
          (i) =>
            i.toEmail.toLowerCase() === email.toLowerCase() &&
            i.status === "pending",
        ),
    }),
    {
      name: "mvp-notifications",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ invitations: state.invitations }),
    },
  ),
);