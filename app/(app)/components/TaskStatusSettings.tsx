"use client";

// ============================================================
// Gestion des colonnes de tâches (réservée au propriétaire / admin).
//
// Deux règles imposées par le backend et reprises ici :
// - un statut utilisé par au moins une tâche ne peut pas être supprimé, il faut
//   d'abord le réaffecter ;
// - une agence doit garder au moins un statut qui clôt une tâche.
// ============================================================
import { useState } from "react";
import { Check, CircleDot, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createTaskStatus,
  deleteTaskStatus,
  reassignTaskStatus,
  updateTaskStatus,
} from "@/lib/taskStatuses";
import { getApiErrorMessage } from "@/lib/api";
import { useTaskStatuses } from "@/lib/useTaskStatuses";
import type { TaskStatusMeta } from "@/lib/types";

const DEFAULT_COLOR = "#056cf2";

export default function TaskStatusSettings({ agencyId }: { agencyId: string }) {
  const { statuses, usesDefaults, loading, error, refresh } = useTaskStatuses();

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState(DEFAULT_COLOR);
  const [formError, setFormError] = useState<string | null>(null);

  // Statut à supprimer, avec la colonne de repli proposée.
  const [removing, setRemoving] = useState<{ status: TaskStatusMeta; used: number } | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    setFormError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setFormError(getApiErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const submitAdd = () =>
    run("add", async () => {
      await createTaskStatus(agencyId, { label: newLabel, color: newColor });
      setNewLabel("");
      setNewColor(DEFAULT_COLOR);
      setAdding(false);
    });

  const submitEdit = (id: number) =>
    run(`edit-${id}`, async () => {
      await updateTaskStatus(agencyId, id, { label: editLabel, color: editColor });
      setEditingId(null);
    });

  const toggleTerminal = (s: TaskStatusMeta) => {
    if (s.id == null) return;
    return run(`term-${s.key}`, async () => {
      await updateTaskStatus(agencyId, s.id!, { is_terminal: !s.is_terminal });
    });
  };

  const terminalCount = statuses.filter((s) => s.is_terminal).length;
  const lastTerminal = terminalCount <= 1;
  const otherStatuses = removing
    ? statuses.filter((s) => s.key !== removing.status.key)
    : [];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Ces colonnes apparaissent dans le Kanban, le planning et la fiche tâche.
          Une colonne marquée{" "}
          <strong style={{ color: "var(--text-primary)" }}>clôt</strong> considère la tâche comme terminée.
        </p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.03]"
            style={{ background: "var(--gradient-button)" }}
          >
            <Plus size={15} /> Ajouter une colonne
          </button>
        )}
      </div>

      {usesDefaults && !loading && (
        <p
          className="text-xs px-3 py-2 rounded-xl"
          style={{ background: "var(--hover-soft)", color: "var(--text-muted)" }}
        >
          Aucune personnalisation pour l&apos;instant : les quatre colonnes par défaut
          s&apos;appliquent. Les ajouter ci-dessous les complète sans les remplacer.
        </p>
      )}

      {error && !loading && (
        <p className="text-xs px-3 py-2 rounded-xl" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}
      {formError && (
        <p className="text-xs px-3 py-2 rounded-xl" style={{ color: "var(--color-error)" }}>
          {formError}
        </p>
      )}

      {/* Formulaire d'ajout */}
      {adding && (
        <div
          className="flex flex-wrap items-end gap-3 p-4 rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Nom de la colonne
            </label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex. En attente client"
              maxLength={80}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Couleur
            </label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-12 h-9 rounded-xl cursor-pointer"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submitAdd}
              disabled={busy === "add" || newLabel.trim() === ""}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "var(--gradient-button)" }}
            >
              {busy === "add" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Créer
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewLabel("");
              }}
              className="p-2 rounded-xl"
              style={{ background: "var(--hover-soft)", color: "var(--text-secondary)" }}
              aria-label="Annuler"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Liste des colonnes */}
      <ul className="space-y-2">
        {statuses.map((s) => (
          <li
            key={s.key}
            className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: s.color }}
              aria-hidden
            />

            {editingId === s.id ? (
              <>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  maxLength={80}
                  className="flex-1 min-w-[160px] px-3 py-1.5 rounded-xl text-sm"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-10 h-8 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => s.id != null && submitEdit(s.id)}
                  disabled={busy === `edit-${s.id}`}
                  className="p-2 rounded-xl"
                  style={{ background: "var(--hover-soft)", color: "var(--text-primary)" }}
                  aria-label="Enregistrer"
                >
                  {busy === `edit-${s.id}` ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-2 rounded-xl"
                  style={{ background: "var(--hover-soft)", color: "var(--text-secondary)" }}
                  aria-label="Annuler"
                >
                  <X size={15} />
                </button>
              </>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {s.label}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {s.key}
                    {!s.id && " · colonne par défaut"}
                  </div>
                </div>

                {s.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleTerminal(s)}
                      disabled={busy === `term-${s.key}` || (s.is_terminal && lastTerminal)}
                      title={
                        s.is_terminal && lastTerminal
                          ? "Une agence doit garder au moins un statut qui clôt une tâche."
                          : undefined
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={
                        s.is_terminal
                          ? { background: "rgba(16,185,129,0.12)", color: "var(--color-success)" }
                          : { background: "var(--hover-soft)", color: "var(--text-muted)" }
                      }
                    >
                      {busy === `term-${s.key}` ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <CircleDot size={13} />
                      )}
                      {s.is_terminal ? "Clôt" : "Ouverte"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(s.id!);
                        setEditLabel(s.label);
                        setEditColor(s.color);
                      }}
                      className="p-2 rounded-xl"
                      style={{ background: "var(--hover-soft)", color: "var(--text-secondary)" }}
                      aria-label={`Renommer ${s.label}`}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setRemoving({ status: s, used: 0 });
                        setReassignTo(otherStatuses[0]?.key ?? "");
                      }}
                      className="p-2 rounded-xl"
                      style={{ background: "var(--hover-soft)", color: "var(--color-error)" }}
                      aria-label={`Supprimer ${s.label}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setAdding(true);
                      setNewLabel(`${s.label} (copie)`);
                      setNewColor(s.color);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "var(--hover-soft)", color: "var(--text-secondary)" }}
                    title="Créer une colonne personnalisée à partir de celle-ci"
                  >
                    <Plus size={13} /> Personnaliser
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Confirmation de suppression / réaffectation */}
      {removing && (
        <div
          className="flex flex-wrap items-end gap-3 p-4 rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid rgba(239,68,68,0.35)" }}
        >
          <div className="flex-1 min-w-[220px]">
            <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Supprimer « {removing.status.label} »
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Si des tâches utilisent encore cette colonne, déplacez-les d&apos;abord :
              sinon la suppression sera refusée.
            </p>
          </div>

          {otherStatuses.length > 0 && (
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Déplacer les tâches vers
              </label>
              <select
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--text-primary)",
                }}
              >
                {otherStatuses.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            {otherStatuses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const id = removing.status.id;
                  if (id == null) return;
                  void run(`reassign-${removing.status.key}`, async () => {
                    await reassignTaskStatus(agencyId, id, reassignTo);
                    await deleteTaskStatus(agencyId, id);
                    setRemoving(null);
                  });
                }}
                disabled={busy !== null}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "var(--gradient-button)" }}
              >
                {busy === `reassign-${removing.status.key}` ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Déplacer et supprimer
              </button>
            )}
            <button
              type="button"
              onClick={() => setRemoving(null)}
              className="p-2 rounded-xl"
              style={{ background: "var(--hover-soft)", color: "var(--text-secondary)" }}
              aria-label="Annuler"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
