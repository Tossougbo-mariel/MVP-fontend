"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ✅ Commentaire rattaché à une tâche
export type TaskComment = {
  id: string;
  taskId: string;
  authorEmail: string; // email de l'auteur
  content: string;
  createdAt: string; // horodatage ISO
};

// ✅ Tous les commentaires d'une tâche (tri : plus anciens en premier)
export const getCommentsByTask = (comments: TaskComment[], taskId: string): TaskComment[] =>
  comments
    .filter((c) => c.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

type CommentState = {
  comments: TaskComment[];
  addComment: (data: { taskId: string; authorEmail: string; content: string }) => TaskComment;
  deleteComment: (commentId: string) => void;
  deleteCommentsByTask: (taskId: string) => void;
  deleteCommentsByProject: (taskIds: string[]) => void;
};

export const useCommentStore = create<CommentState>()(
  persist(
    (set) => ({
      comments: [] as TaskComment[],

      // ✅ Ajout d'un commentaire
      addComment: (data) => {
        const comment: TaskComment = {
          id: "commentaire" + Date.now(),
          taskId: data.taskId,
          authorEmail: data.authorEmail,
          content: data.content.trim(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ comments: [...state.comments, comment] }));
        return comment;
      },

      // ✅ Suppression d'un commentaire (auteur seulement)
      deleteComment: (commentId) =>
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== commentId),
        })),

      // ✅ Cascade : à la suppression d'une tâche, ses commentaires disparaissent
      deleteCommentsByTask: (taskId) =>
        set((state) => ({
          comments: state.comments.filter((c) => c.taskId !== taskId),
        })),

      // ✅ Cascade : à la suppression d'un projet, les commentaires de ses tâches disparaissent
      deleteCommentsByProject: (taskIds) =>
        set((state) => ({
          comments: state.comments.filter((c) => !taskIds.includes(c.taskId)),
        })),
    }),
    {
      name: "mvp-commentaires",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ comments: state.comments }),
    }
  )
);