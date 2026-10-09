"use client";

import { create } from "zustand";

/** "bientot" = moins de 2 jours avant l'échéance, "retard" = échéance passée. */
export type DeadlineAlertStage = "bientot" | "retard";

export type DeadlineAlert = {
  taskId: number;
  stage: DeadlineAlertStage;
  /** Titre de l'alerte. */
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
  /** Message complet de l'alerte. */
  message: string;
};

type DeadlineAlertStore = {
  /** Tâches en situation d'alerte (≤ 2 jours ou en retard) : pilote l'icône. */
  active: DeadlineAlert[];
  /** Incrémenté quand une alerte vient d'être détectée : déplie le menu latéral. */
  deployTick: number;
  setActive: (active: DeadlineAlert[]) => void;
  bumpDeploy: () => void;
};

export const useDeadlineAlertStore = create<DeadlineAlertStore>((set) => ({
  active: [],
  deployTick: 0,
  setActive: (active) => set({ active }),
  bumpDeploy: () => set((state) => ({ deployTick: state.deployTick + 1 })),
}));
