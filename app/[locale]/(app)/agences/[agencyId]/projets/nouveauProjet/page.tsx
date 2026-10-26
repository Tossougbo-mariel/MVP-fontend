"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { projectHref, projectsHref } from "@/lib/projectHref";
import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle2,
  FolderKanban,
  Image as ImageIcon,
  ImageOff,
  Send,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useAppData } from "@/lib/appData";
import { hasRight } from "@/lib/types";
import { useAuthStore } from "@/app/store/authStore";
import { createProject as apiCreateProject, addProjectMember, getApiErrorMessage } from "@/lib/services";
import { WALLPAPERS } from "@/app/store/wallpapers";
import DatePicker from "@/app/[locale]/(app)/components/DatePicker";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const today = new Date();
const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

export default function NouveauProjetPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { reload, agencyById, data } = useAppData();
  const t = useTranslations("Projects.new");
  const tStatus = useTranslations("ProjectStatuses");
  const tErrors = useTranslations("Projects.errors");
  const te = useTranslations("Errors");
  const tc = useTranslations("Common");
  const tv = useTranslations("Validation");
  const tn = useTranslations("Navigation.app");

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
  const [addResult, setAddResult] = useState<{ added: number; failed: string[] } | null>(null);

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
    if (!name.trim()) fe.name = tv("projectNameRequired");
    if (!startDate) {
      fe.startDate = tv("startDateRequired");
    } else if (startDate < todayISO) {
      fe.startDate = tv("startDateNotPast");
    } else if (!dueDate) {
      fe.dueDate = tv("dueDateRequired");
    } else if (dueDate < startDate) {
      fe.dueDate = tv("dueDateBeforeStart");
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
      const failed: string[] = [];
      for (const email of memberEmails) {
        try {
          await addProjectMember(project.id, email);
        } catch {
          failed.push(email);
        }
      }

      await reload();
      setAddResult({ added: memberEmails.length - failed.length, failed });
      setTimeout(() => {
        router.push(projectHref(agencyId, project.id));
      }, 1500);
    } catch (err) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]> } };
      };
      const backendErrors = axiosErr?.response?.data?.errors;
      if (backendErrors && Object.keys(backendErrors).length > 0) {
        const fe: Record<string, string> = {};
        for (const [field, messages] of Object.entries(backendErrors)) {
          const key =
            field === "start_date" ? "startDate"
            : field === "due_date" ? "dueDate"
            : field === "name" ? "name"
            : field;
          fe[key] = messages[0] ?? tv("invalidField");
        }
        setFieldErrors(fe);
      } else {
        setApiError(getApiErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{tc("loading")}</p>
      </div>
    );
  }

  // ✅ Si l'agence n'existe pas
  if (!agency) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {te("agencyNotFound")}
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> {tn("myAgencies")}
        </Link>
      </div>
    );
  }

  // ✅ Si l'utilisateur n'est pas membre
  if (!user || !activeMembers.some((m) => m.user.email.toLowerCase() === user.email.toLowerCase())) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {te("notAgencyMember")}
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> {tc("backToMyAgencies")}
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
          {te("accessDenied")}
        </p>
        <p className="max-w-sm" style={{ color: "var(--text-secondary)" }}>
          {tErrors("accessDeniedCreate")}
        </p>
        <Link
          href={projectsHref(agencyId)}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> {tErrors("backToProjects")}
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
        <div className="flex items-center gap-4">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              width: 52,
              height: 52,
              background: "var(--gradient-primary)",
              boxShadow: "0 10px 26px -8px rgba(var(--blue-rgb),0.55)",
            }}
          >
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              {t("title")}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {t("subtitle", { agency: agency.name, status: tStatus("a_venir") })}
            </p>
          </div>
        </div>
      </motion.div>

      {addResult && (
        <motion.div
          variants={item}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 flex items-start gap-3"
          style={{
            boxShadow: "var(--shadow-card)",
            border:
              addResult.failed.length > 0
                ? "1px solid rgba(239,68,68,0.35)"
                : "1px solid rgba(16,185,129,0.35)",
          }}
        >
          {addResult.failed.length > 0 ? (
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: "var(--color-error)" }} />
          ) : (
            <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" style={{ color: "var(--color-success)" }} />
          )}
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {t("successTitle")}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {t("membersAdded", { count: addResult.added })}
              {addResult.failed.length > 0 && (
                <span style={{ color: "var(--color-error)" }}>
                  {" "}
                  {t("membersFailed", {
                    count: addResult.failed.length,
                    emails: addResult.failed.join(", "),
                  })}
                </span>
              )}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {t("redirecting")}
            </p>
          </div>
        </motion.div>
      )}

      <motion.form variants={item} onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
            {t("nameLabel")} <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            placeholder={t("namePlaceholder")}
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
            {t("descriptionLabel")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={3}
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
            style={inputStyle}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
              <Calendar size={14} /> {t("startDateLabel")} <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <DatePicker
              value={startDate}
              min={todayISO}
              onChange={(v) => {
                setStartDate(v);
                clearFieldError("startDate");
                clearFieldError("dueDate");
              }}
              className="w-full"
            />
            {fieldErrors.startDate && (
              <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                {fieldErrors.startDate}
              </p>
            )}
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
              <CalendarPlus size={14} /> {t("dueDateLabel")} <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <DatePicker
              value={dueDate}
              onChange={(v) => {
                setDueDate(v);
                clearFieldError("dueDate");
              }}
              className="w-full"
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
            <Users size={14} /> {t("membersLabel")}
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
            {t("membersHint")}
          </p>
        </div>

        {/* Fond d'écran du Kanban (optionnel) */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
            <ImageIcon size={14} /> {t("wallpaperLabel")} <span className="font-normal" style={{ color: "var(--text-muted)" }}>{t("optional")}</span>
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
              {t("defaultWallpaper")}
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
                    boxShadow: active ? "0 6px 16px -6px rgba(var(--blue-rgb),0.5)" : undefined,
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
            href={projectsHref(agencyId)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={16} /> {tc("cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
            style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(var(--blue-rgb),0.4)" }}
          >
            <Send size={16} /> {submitting ? t("submitting") : t("submit")}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
