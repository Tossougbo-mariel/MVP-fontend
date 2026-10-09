"use client";

import { create } from "zustand";

/** "bientot" = moins de 2 jours avant l'échéance, "retard" = échéance passée. */
export type DeadlineAlertStage = "bientot" | "retard";

export type DeadlineAlert = {
  taskId: number;
  stage: DeadlineAlertStage;
  /** Titre affiché dans la bannière. */
  title: string;
  /** Intitulé de la tâche : ce que la liste déroulante et la page des alertes
   *  affichent en ligne, sans devoir relier l'alerte à sa tâche. */
  taskTitle: string;
  /** Projet porteur : permet de construire le lien vers la tâche. */
  projectId: number;
  /** Échéance brute (date ou datetime ISO). */
  dueDate: string;
  /** Jours restants arrondis au-dessus (null en retard). */
  daysLeft: number | null;
  /** Message affiché, lu à voix haute. */
  message: string;
};

const MUTE_STORAGE_KEY = "deadline-alert-muted";

type DeadlineAlertStore = {
  /** Tâches en situation d'alerte (≤ 2 jours ou en retard) : pilote l'icône. */
  active: DeadlineAlert[];
  /** Alerte affichée dans la bannière. */
  current: DeadlineAlert | null;
  /** Dernier message affiché : permet de le ressortir après fermeture. */
  last: DeadlineAlert | null;
  open: boolean;
  /** En cours de repli animé vers l'icône (avant démontage). */
  closing: boolean;
  /** Incrémenté à chaque ouverture : force le rejeu de l'animation de sortie. */
  token: number;
  /** Incrémenté à chaque demande de repli émise depuis une icône. */
  closeTick: number;
  muted: boolean;
  setActive: (active: DeadlineAlert[]) => void;
  setCurrent: (current: DeadlineAlert | null) => void;
  setLast: (last: DeadlineAlert | null) => void;
  setOpen: (open: boolean) => void;
  setClosing: (closing: boolean) => void;
  bumpToken: () => void;
  /** Demande le repli : c'est le centre qui l'exécute (animation + filet de sécurité). */
  requestClose: () => void;
  setMuted: (muted: boolean) => void;
};

export const useDeadlineAlertStore = create<DeadlineAlertStore>((set) => ({
  active: [],
  current: null,
  last: null,
  open: false,
  closing: false,
  token: 0,
  closeTick: 0,
  muted:
    typeof window !== "undefined" &&
    window.localStorage.getItem(MUTE_STORAGE_KEY) === "1",
  setActive: (active) => set({ active }),
  setCurrent: (current) => set({ current }),
  setLast: (last) => set({ last }),
  // Rouvrir annule un repli éventuellement en cours.
  setOpen: (open) => set(open ? { open: true, closing: false } : { open: false }),
  setClosing: (closing) => set({ closing }),
  bumpToken: () => set((state) => ({ token: state.token + 1 })),
  requestClose: () => set((state) => ({ closeTick: state.closeTick + 1 })),
  setMuted: (muted) => {
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
    } catch {
      // stockage indisponible : le choix ne tiendra que pour la session
    }
    set({ muted });
  },
}));
