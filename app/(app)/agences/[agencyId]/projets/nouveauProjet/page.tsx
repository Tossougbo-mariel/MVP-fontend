"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Check,
  FolderKanban,
  Image as ImageIcon,
  ImageOff,
  Send,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useAppData } from "@/lib/appData";
import { hasRight } from "@/lib/types";
import DatePickerField from "@/app/(app)/components/DatePickerField";
import { useAuthStore } from "@/app/store/authStore";
import { createProject as apiCreateProject, addProjectMember, getApiErrorMessage } from "@/lib/services";
import { WALLPAPERS } from "@/app/store/wallpapers";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function NouveauProjetPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { reload, agencyById, data } = useAppData();

  const agency = agencyById(agencyId);

  const canCreateProjects = hasRight(agency, user?.email ?? "", "createProjects");

  // ====== Champs du formulaire ======
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [wallpaperId, setWallpaperId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeMembers = (agency?.members ?? []).filter((m) => m.status === "actif");

  const toggleMember = (email: string) => {
    setMemberEmails((prev) =>
      prev.some((e) => e.toLowerCase() === email.toLowerCase())
        ? prev.filter((e) => e.toLowerCase() !== email.toLowerCase())
        : [...prev, email]
    );
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);

    const fe: Record<string, string> = {};
    if (!name.trim()) fe.name = "Le nom du projet est obligatoire.";
    if (!startDate) {
      fe.startDate = "La date de début est obligatoire.";
    } else if (!dueDate) {
      fe.dueDate = "La date d'échéance est obligatoire.";
    } else if (dueDate < startDate) {
      fe.dueDate = "La date d'échéance doit être postérieure ou égale à la date de début.";
    }
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }

    setSubmitting(true);
    try {
      const project = await apiCreateProject(agencyId, {
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        due_date: dueDate || null,
        wallpaper: wallpaperId,
      });

      // Ajouter les membres sélectionnés (y compris le user connecté si sélectionné)
      for (const email of memberEmails) {
        try {
          await addProjectMember(project.id, email);
        } catch {
          // ignorer les erreurs individuelles (ex: email non membre actif)
        }
      }

      await reload();
      router.push(`/agences/${agencyId}/projets/${project.id}`);
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }

  // ✅ Si l'agence n'existe pas
  if (!agency) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Agence introuvable
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Mes agences
        </Link>
      </div>
    );
  }

  // ✅ Si l'utilisateur n'est pas membre
  if (!user || !activeMembers.some((m) => m.user.email.toLowerCase() === user.email.toLowerCase())) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Vous n&apos;êtes pas membre de cette agence.
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Retour à Mes agences
        </Link>
      </div>
    );
  }

  // ✅ Accès selon le réglage « qui peut créer des projets »
  if (!canCreateProjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-soft)" }}
        >
          <ShieldAlert className="w-8 h-8" style={{ color: "var(--color-error)" }} />
        </div>
        <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
          Accès refusé
        </p>
        <p className="max-w-sm" style={{ color: "var(--text-secondary)" }}>
          Cette page est réservée au propriétaire et aux admins de l&apos;agence. Seuls eux peuvent créer un projet.
        </p>
        <Link
          href={`/agences/${agencyId}/projets`}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Retour aux projets
        </Link>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--text-primary)",
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <FolderKanban className="w-6 h-6" style={{ color: "#056cf2" }} /> Nouveau projet
        </h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          Créer un projet dans {agency.name}. Le statut démarre à « À venir ».
        </p>
      </motion.div>

      <motion.form variants={item} onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
            Nom du projet <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            placeholder="Ex : Site vitrine 2026"
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={inputStyle}
          />
            {fieldErrors.name && (
              <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                {fieldErrors.name}
              </p>
            )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez l'objectif du projet…"
            rows={3}
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
            style={inputStyle}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
              <Calendar size={14} /> Date de début <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <DatePickerField
              value={startDate}
              onChange={(v) => {
                setStartDate(v);
                clearFieldError("startDate");
                clearFieldError("dueDate");
              }}
              className="w-full"
              style={inputStyle}
            />
            {fieldErrors.startDate && (
              <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                {fieldErrors.startDate}
              </p>
            )}
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
              <CalendarPlus size={14} /> Date d&apos;échéance <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <DatePickerField
              value={dueDate}
              onChange={(v) => {
                setDueDate(v);
                clearFieldError("dueDate");
              }}
              className="w-full"
              style={inputStyle}
            />
            {fieldErrors.dueDate && (
              <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                {fieldErrors.dueDate}
              </p>
            )}
          </div>
        </div>

        {/* Membres assignés */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
            <Users size={14} /> Membres assignés
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeMembers.map((m) => {
              const checked = memberEmails.some(
                (e) => e.toLowerCase() === m.user.email.toLowerCase()
              );
              return (
                <button
                  key={m.user.email}
                  type="button"
                  onClick={() => toggleMember(m.user.email)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
                  style={
                    checked
                      ? { background: "var(--accent-soft)", border: "1px solid var(--accent-text)", color: "var(--text-primary)" }
                      : { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }
                  }
                >
                  <span
                    className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                    style={
                      checked
                        ? { background: "var(--gradient-button)", color: "#fff" }
                        : { border: "1px solid var(--input-border)" }
                    }
                  >
                    {checked && <Check size={11} />}
                  </span>
                  <span className="truncate">
                    {m.user.firstName} {m.user.lastName}
                    <span className="block text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                      {m.user.email}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Les membres sélectionnés seront ajoutés au projet après sa création.
          </p>
        </div>

        {/* Fond d'écran du Kanban (optionnel) */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
            <ImageIcon size={14} /> Fond d&apos;écran du Kanban <span className="font-normal" style={{ color: "var(--text-muted)" }}>(optionnel)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setWallpaperId(null)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-4 text-xs font-semibold transition-all"
              style={
                wallpaperId === null
                  ? { background: "var(--accent-soft)", border: "1px solid var(--accent-text)", color: "var(--accent-text)" }
                  : { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }
              }
            >
              <ImageOff size={18} />
              Par défaut
            </button>
            {WALLPAPERS.map((wp) => {
              const active = wallpaperId === wp.id;
              return (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setWallpaperId(active ? null : wp.id)}
                  className="relative rounded-xl overflow-hidden aspect-video transition-all"
                  style={{
                    border: active ? "2px solid var(--accent-text)" : "1px solid var(--input-border)",
                    boxShadow: active ? "0 6px 16px -6px rgba(5,108,242,0.5)" : undefined,
                  }}
                  title={wp.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={wp.thumb} alt={wp.label} loading="lazy" className="w-full h-full object-cover" />
                  <span
                    className="absolute bottom-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(2,6,23,0.6)", color: "#fff" }}
                  >
                    {wp.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Erreur API (bandeau global) */}
        {apiError && (
          <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
            {apiError}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
          <Link
            href={`/agences/${agencyId}/projets`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={16} /> Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
            style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
          >
            <Send size={16} /> {submitting ? "Création…" : "Créer le projet"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
