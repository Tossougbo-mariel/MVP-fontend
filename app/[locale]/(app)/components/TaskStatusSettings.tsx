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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Statuses");
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
          {t("explain.appearsIn")}{" "}
          {t.rich("explain.terminal", {
            strong: (chunks) => <strong style={{ color: "var(--text-primary)" }}>{chunks}</strong>,
          })}
        </p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.03]"
            style={{ background: "var(--gradient-button)" }}
          >
            <Plus size={15} /> {t("actions.add")}
          </button>
        )}
      </div>

      {usesDefaults && !loading && (
        <p
          className="text-xs px-3 py-2 rounded-xl"
          style={{ background: "var(--hover-soft)", color: "var(--text-muted)" }}
        >
          {t("empty.hint")}
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
              {t("form.name")}
            </label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={t("form.placeholder")}
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
              {t("form.color")}
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
              {t("actions.create")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewLabel("");
              }}
              className="p-2 rounded-xl"
              style={{ background: "var(--hover-soft)", color: "var(--text-secondary)" }}
              aria-label={t("actions.cancel")}
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
                  aria-label={t("actions.save")}
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
                  aria-label={t("actions.cancel")}
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
                    {!s.id && t("defaultSuffix")}
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
                          ? t("validation.mustKeepTerminal")
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
                      {s.is_terminal ? t("badge.terminal") : t("badge.open")}
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
                      aria-label={t("actions.rename", { name: s.label })}
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
                      aria-label={t("actions.delete", { name: s.label })}
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
                      setNewLabel(`${s.label}${t("copySuffix")}`);
                      setNewColor(s.color);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "var(--hover-soft)", color: "var(--text-secondary)" }}
                    title={t("customizeFrom")}
                  >
                    <Plus size={13} /> {t("actions.customize")}
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
              {t("delete.title", { name: removing.status.label })}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {t("delete.warning")}
            </p>
          </div>

          {otherStatuses.length > 0 && (
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                {t("delete.moveTo")}
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
                {t("delete.moveAndDelete")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setRemoving(null)}
              className="p-2 rounded-xl"
              style={{ background: "var(--hover-soft)", color: "var(--text-secondary)" }}
              aria-label={t("actions.cancel")}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
