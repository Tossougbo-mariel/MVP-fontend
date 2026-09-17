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

// ====== Notifications de tâches (5 types) ======
export type TaskNotificationType =
  | "nouvelle_tache"
  | "retrait_tache"
  | "commentaire"
  | "echeance_proche"
  | "en_retard"
  | "nouveau_projet";

export type TaskNotification = {
  id: string;
  type: TaskNotificationType;
  agencyId: string;
  taskId?: string;
  taskTitle?: string;
  projectId: string;
  projectName: string;
  toEmail: string;
  fromEmail?: string;
  message?: string;
  read: boolean;
  createdAt: string;
};

type NotificationsState = {
  invitations: Invitation[];
  taskNotifications: TaskNotification[];

  // --- Invitations ---
  sendInvitation: (data: {
    agencyId: string;
    agencyName: string;
    toEmail: string;
    fromEmail: string;
  }) => Invitation | null;
  cancelInvitation: (id: string) => void;
  acceptInvitation: (id: string) => void;
  declineInvitation: (id: string) => void;
  pendingFor: (email: string) => Invitation[];

  // --- Notifications de tâches ---
  addTaskNotification: (
    data: Omit<TaskNotification, "id" | "read" | "createdAt">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (agencyId: string, email: string) => void;
  markAllTaskNotificationsRead: (email: string) => void;
  unreadCountForAgency: (agencyId: string, email: string) => number;
  notificationsForAgency: (agencyId: string, email: string) => TaskNotification[];
  syncDeadlineNotifications: (
    agencyId: string,
    email: string,
    tasks: {
      id: string;
      title: string;
      projectId: string;
      projectName: string;
      deadline: string;
      status: string;
      assigneeEmail: string;
    }[],
  ) => void;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      invitations: [],
      taskNotifications: [],

      // ====== Invitations ======

      // Envoie une invitation (empêche les doublons tant qu'une invitation est encore pending)
      sendInvitation: ({ agencyId, agencyName, toEmail, fromEmail }) => {
        const dup = get().invitations.some(
          (i) =>
            i.agencyId === agencyId &&
            i.toEmail.toLowerCase() === toEmail.toLowerCase() &&
            i.status === "pending",
        );
        if (dup) return null;
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
        return invitation;
      },

      // Annule une invitation en attente (l'utilisateur ne pourra plus l'accepter)
      cancelInvitation: (id) =>
        set((s) => ({
          invitations: s.invitations.filter((i) => i.id !== id),
        })),

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

      // ====== Notifications de tâches ======

      addTaskNotification: (data) => {
        const now = new Date().toISOString().slice(0, 10);
        const notification: TaskNotification = {
          ...data,
          id: "tn" + Date.now() + Math.random().toString(36).slice(2, 6),
          read: false,
          createdAt: now,
        };
        set((s) => ({
          taskNotifications: [notification, ...s.taskNotifications],
        }));
      },

      markAsRead: (id) =>
        set((s) => ({
          taskNotifications: s.taskNotifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllAsRead: (agencyId, email) =>
        set((s) => ({
          taskNotifications: s.taskNotifications.map((n) =>
            n.agencyId === agencyId &&
            n.toEmail.toLowerCase() === email.toLowerCase()
              ? { ...n, read: true }
              : n,
          ),
        })),

      markAllTaskNotificationsRead: (email) =>
        set((s) => ({
          taskNotifications: s.taskNotifications.map((n) =>
            n.toEmail.toLowerCase() === email.toLowerCase()
              ? { ...n, read: true }
              : n,
          ),
        })),

      unreadCountForAgency: (agencyId, email) =>
        get().taskNotifications.filter(
          (n) =>
            n.agencyId === agencyId &&
            n.toEmail.toLowerCase() === email.toLowerCase() &&
            !n.read,
        ).length,

      notificationsForAgency: (agencyId, email) =>
        get().taskNotifications.filter(
          (n) =>
            n.agencyId === agencyId &&
            n.toEmail.toLowerCase() === email.toLowerCase(),
        ),

      // ✅ Génère automatiquement les notifications d'échéance (proche / retard)
      // à partir des tâches réelles. Dédoublonnage par (type, taskId).
      syncDeadlineNotifications: (agencyId, email, tasks) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const parse = (iso: string) => {
          const d = new Date(iso + "T00:00:00");
          return d;
        };
        const diffDays = (d: Date) =>
          Math.round((d.getTime() - today.getTime()) / 86400000);

        const existing = get().taskNotifications.filter(
          (n) => n.agencyId === agencyId,
        );
        const has = (taskId: string, type: TaskNotificationType) =>
          existing.some(
            (n) => n.taskId === taskId && n.type === type,
          );

        const nowIso = new Date().toISOString().slice(0, 10);
        const toAdd: TaskNotification[] = [];

        for (const t of tasks) {
          const isForUser =
            t.assigneeEmail.toLowerCase() === email.toLowerCase();
          if (!isForUser) continue;
          if (t.status === "terminee") continue;

          const daysLeft = diffDays(parse(t.deadline));
          const taskId = t.id;

          if (daysLeft < 0 && !has(taskId, "en_retard")) {
            toAdd.push({
              id: "tn" + Date.now() + Math.random().toString(36).slice(2, 6),
              type: "en_retard",
              agencyId,
              taskId,
              taskTitle: t.title,
              projectId: t.projectId,
              projectName: t.projectName,
              toEmail: email,
              read: false,
              createdAt: nowIso,
            });
          } else if (
            daysLeft >= 0 &&
            daysLeft <= 2 &&
            !has(taskId, "echeance_proche")
          ) {
            toAdd.push({
              id: "tn" + Date.now() + Math.random().toString(36).slice(2, 6),
              type: "echeance_proche",
              agencyId,
              taskId,
              taskTitle: t.title,
              projectId: t.projectId,
              projectName: t.projectName,
              toEmail: email,
              read: false,
              createdAt: nowIso,
            });
          }
        }

        if (toAdd.length > 0) {
          set((s) => ({
            taskNotifications: [...toAdd, ...s.taskNotifications],
          }));
        }
      },
    }),
    {
      name: "mvp-notifications",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        invitations: state.invitations,
        taskNotifications: state.taskNotifications,
      }),
    },
  ),
);