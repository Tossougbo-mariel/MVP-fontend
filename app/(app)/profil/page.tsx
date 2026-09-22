"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import Cropper from "react-easy-crop";
import {
  User, Mail, Briefcase, Pencil, Save, CheckCircle2, ShieldCheck,
  Globe, Bell, Camera, Calendar, ClipboardList, Building2, ChevronRight, X, ZoomIn,
  CheckSquare, AlertTriangle, Eye, Plus,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import CustomSelectField from "@/app/(app)/components/CustomSelectField";
import CustomSlider from "@/app/(app)/components/CustomSlider";
import { userAgencies, userRoleInAgency, DEFAULT_NOTIFICATION_PREFERENCES, LABEL_NOTIFICATION_PREFERENCE, type MyTask, type NotificationPreferences } from "@/lib/types";
import { fetchNotificationPreferences, updateNotificationPreferences, getApiErrorMessage } from "@/lib/services";
import AvatarViewer from "@/app/(app)/components/AvatarViewer";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

type InfosPersonnelles = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  jobTitle: string;
  bio: string;
};
type CropperArea = { x: number; y: number; width: number; height: number };

type TacheStatus = "Assignée" | "Terminée" | "En retard";

const ROLE_LABEL: Record<"owner" | "admin" | "membre", string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  membre: "Membre",
};

const STATUS_STYLE: Record<TacheStatus, React.CSSProperties> = {
  "Assignée": { background: "rgba(5,108,242,0.15)", color: "#0c79f2" },
  "Terminée": { background: "rgba(16,185,129,0.12)", color: "var(--color-success)" },
  "En retard": { background: "rgba(239,68,68,0.12)", color: "var(--color-error)" },
};

const statusIcon = (status: TacheStatus) => {
  if (status === "Terminée") return <CheckCircle2 size={13} />;
  if (status === "En retard") return <AlertTriangle size={13} />;
  return <CheckSquare size={13} />;
};

const displayStatus = (t: MyTask): TacheStatus => {
  if (t.status === "terminee") return "Terminée";
  const today = new Date().toISOString().slice(0, 10);
  if (t.deadline && t.deadline < today) return "En retard";
  return "Assignée";
};

const formatEcheance = (d: string | null): string => {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: CropperArea,
  width = 400,
  height = 400,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de charger l'image"));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supporté");

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    width,
    height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Échec de l'export de l'image"));
    }, "image/png");
  });
}

function Champ({
  label, value, onChange, editing, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide mb-1 block" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        disabled={!editing}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-3 focus:outline-none disabled:opacity-70"
        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
      />
    </div>
  );
}

export default function ProfilPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { data, myTasksInAgency, myTasks, agencyById } = useAppData();
  const agencies = data.agencies;
  const myAgencies = user ? userAgencies(agencies, user.email) : [];

  // ✅ Agence active : transmise via ?agency= depuis le Header quand on navigue
  // depuis une agence. Sans contexte → rôle agrégé et tâches de toutes les agences.
  const contextAgencyId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("agency")
    : null;
  const contextAgency = contextAgencyId ? agencyById(contextAgencyId) : undefined;
  const contextRole: "owner" | "admin" | "membre" | null =
    contextAgency && user ? userRoleInAgency(contextAgency, user.email) : null;

  // Rôle effectif : celui du contexte s'il existe, sinon on agrège sur toutes
  // les agences de l'utilisateur (owner > admin > membre).
  const fallbackRole: "owner" | "admin" | "membre" | null = (() => {
    if (!user || myAgencies.length === 0) return null;
    const roles = myAgencies.map((a) => userRoleInAgency(a, user.email));
    if (roles.includes("owner")) return "owner";
    if (roles.includes("admin")) return "admin";
    if (roles.includes("membre")) return "membre";
    return null;
  })();
  const displayRole = contextRole ?? fallbackRole;

  const taches = (contextAgencyId && contextRole
    ? myTasksInAgency(contextAgencyId)
    : myTasks()
  ).map((t) => ({
    ...t,
    agencyName: agencyById(t.agencyId)?.name ?? "—",
  }));

  const [photo, setPhoto] = useState<string | null>(null);
  // ✅ CORRIGÉ : on reprend phone/city/bio/jobTitle déjà persistés dans `user`
  // au lieu de les réinitialiser à vide à chaque montage du composant.
  const [infos, setInfos] = useState<InfosPersonnelles>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    jobTitle: user?.jobTitle ?? (displayRole ? ROLE_LABEL[displayRole] : ""),
    bio: user?.bio ?? "",
  });
  const [draft, setDraft] = useState<InfosPersonnelles>(infos);
  const [editing, setEditing] = useState<"personnel" | "professionnel" | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lastRaw, setLastRaw] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropperArea | null>(null);
  const [cropping, setCropping] = useState(false);

  const [language, setLanguage] = useState("fr");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notifPrefsError, setNotifPrefsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchNotificationPreferences()
      .then((prefs) => {
        if (active) setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs });
      })
      .catch(() => {
        if (active) setNotifPrefsError("Impossible de charger vos préférences de notifications.");
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleNotifPref = async (key: keyof NotificationPreferences) => {
    const previous = notifPrefs;
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    setNotifPrefsError(null);
    try {
      const saved = await updateNotificationPreferences({ [key]: next[key] });
      setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...saved });
    } catch (err) {
      setNotifPrefs(previous);
      setNotifPrefsError(getApiErrorMessage(err));
    }
  };

  const startEdit = () => {
    setDraft(infos);
    setEditing("personnel");
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      await updateUser({
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        phone: draft.phone,
        city: draft.city,
        bio: draft.bio,
        jobTitle: draft.jobTitle,
      });
      setInfos(draft);
      setEditing(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Impossible d'enregistrer les modifications.");
    }
  };

  const onCropComplete = useCallback((_: CropperArea, croppedPixels: CropperArea) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    e.target.value = "";
  };

  const handleApplyCrop = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    setCropping(true);
    setSaveError(null);
    try {
      const blob = await getCroppedImg(selectedImage, croppedAreaPixels);
      const url = await blobToDataURL(blob);
      await updateUser({ avatar: url });
      setPhoto(url);
      setLastRaw(selectedImage);
      setSelectedImage(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Impossible d'enregistrer la photo.");
    } finally {
      setCropping(false);
    }
  };

  const reopenCrop = () => {
    if (!lastRaw) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSelectedImage(lastRaw);
  };

  const [viewerOpen, setViewerOpen] = useState(false);

  const set = (key: keyof InfosPersonnelles) => (v: string) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const avatarUrl = photo ?? user?.avatar ?? null;

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
            style={{ background: "var(--surface)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--color-success)" }}
          >
            <CheckCircle2 size={16} /> Profil mis à jour
          </motion.div>
        )}

        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
            style={{ background: "var(--surface)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--color-error)" }}
          >
            <AlertTriangle size={16} /> {saveError}
          </motion.div>
        )}

        <motion.div variants={item} className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center overflow-hidden${avatarUrl ? " cursor-pointer" : ""}`}
                  style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 20px -8px rgba(37,99,235,0.4)" }}
                  onClick={avatarUrl ? () => setViewerOpen(true) : undefined}
                  role={avatarUrl ? "button" : undefined}
                  title={avatarUrl ? "Voir la photo de profil" : undefined}
                >
                  {avatarUrl ? (
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${avatarUrl})` }}
                    />
                  ) : (
                    <User className="w-14 h-14 text-white" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Changer la photo"
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-white"
                  style={{ background: "var(--gradient-button)", boxShadow: "0 4px 10px -4px rgba(37,99,235,0.4)" }}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
                  {infos.firstName} {infos.lastName}
                </h1>
                <p className="mt-1 flex items-center justify-center md:justify-start gap-2" style={{ color: "var(--text-secondary)" }}>
                  <Briefcase size={15} /> {infos.jobTitle}
                </p>
                {displayRole && (
                  <span
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-white px-3 py-1 rounded-full"
                    style={{ background: "var(--gradient-button)", boxShadow: "0 4px 10px -4px rgba(37,99,235,0.4)" }}
                  >
                    <ShieldCheck size={13} />{" "}
                    {ROLE_LABEL[displayRole]}
                  </span>
                )}
              </div>

              {avatarUrl && (
                <button
                  onClick={() => setViewerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shrink-0"
                  style={{ background: "var(--surface)", border: "1px solid var(--chrome-border)", color: "var(--chrome-text-secondary)" }}
                >
                  <Eye size={16} /> Voir
                </button>
              )}
            </div>
          </motion.div>

        <motion.div variants={item} className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Mail size={18} /> Informations personnelles
            </h2>
            {editing !== "personnel" && (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg text-white"
                style={{ background: "var(--gradient-button)", boxShadow: "0 4px 12px -4px rgba(37,99,235,0.35)" }}
              >
                <Pencil size={14} /> Modifier
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Champ label="Prénom" value={draft.firstName} onChange={set("firstName")} editing={editing === "personnel"} />
            <Champ label="Nom" value={draft.lastName} onChange={set("lastName")} editing={editing === "personnel"} />
            <div className="md:col-span-2">
              <Champ label="Email" value={draft.email} onChange={set("email")} editing={editing === "personnel"} type="email" />
            </div>
            <Champ label="Téléphone" value={draft.phone} onChange={set("phone")} editing={editing === "personnel"} />
            <Champ label="Ville / Pays" value={draft.city} onChange={set("city")} editing={editing === "personnel"} />
            <div className="md:col-span-2">
              <Champ label="Bio" value={draft.bio} onChange={set("bio")} editing={editing === "personnel"} />
            </div>
          </div>

          {editing === "personnel" && (
            <motion.button
              onClick={handleSave}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white"
              style={{ background: "var(--gradient-button)", boxShadow: "0 6px 16px -6px rgba(37,99,235,0.4)" }}
            >
              <Save size={16} /> Enregistrer
            </motion.button>
          )}
        </motion.div>

        <motion.div variants={item} className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Briefcase size={18} /> Informations professionnelles
            </h2>
            <span className="text-xs inline-flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <Calendar size={13} /> Inscrit depuis {user?.createdAt ? formatEcheance(user.createdAt) : "peu"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>Mes agences</div>
            {myAgencies.length === 0 && (
              <div
                className="flex flex-col items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {"Vous n'êtes dans aucune agence pour le moment."}
                </p>
                <Link
                  href="/agences/nouvelle"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: "#056cf2" }}
                >
                  <Plus size={15} /> Créer une agence
                </Link>
              </div>
            )}
            {myAgencies.map((a) => (
              <Link
                key={a.id}
                href={`/agences/${a.id}/dashboard`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:opacity-80 transition-opacity"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="flex-1 font-medium" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                {/* ✅ CORRIGÉ : distingue owner/admin/membre au lieu de tout réduire à "Membre" */}
                {(() => {
                  const role = userRoleInAgency(a, user?.email ?? "");
                  return (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={
                        role === "membre"
                          ? { background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }
                          : { background: "var(--gradient-button)", color: "#fff" }
                      }
                    >
                      {role === "owner" ? "Propriétaire" : role === "admin" ? "Admin" : "Membre"}
                    </span>
                  );
                })()}
                <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </Link>
            ))}
          </div>
        </motion.div>

        {displayRole && (
        <motion.div variants={item} className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <ClipboardList size={18} /> Mes tâches
            </h2>
            <span className="text-xs inline-flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <Calendar size={13} /> {taches.length} tâche(s) assignée(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Tâches assignées", count: taches.filter((t) => displayStatus(t) === "Assignée").length, icon: CheckSquare, color: "#0c79f2" },
              { label: "Tâches terminées", count: taches.filter((t) => displayStatus(t) === "Terminée").length, icon: CheckCircle2, color: "var(--color-success)" },
              { label: "Tâches en retard", count: taches.filter((t) => displayStatus(t) === "En retard").length, icon: AlertTriangle, color: "var(--color-error)" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
              >
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
                <div>
                  <div className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{s.count}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left">
                  {["Tâche", "Projet", "Agence", "Échéance", "Statut"].map((h) => (
                    <th
                      key={h}
                      className="text-xs uppercase tracking-wide font-semibold px-4 py-2.5"
                      style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taches.map((t) => {
                  const status = displayStatus(t);
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-[var(--hover-soft)]">
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}>
                        <Link
                          href={`/agences/${t.agencyId}/projets/${t.projectId}/taches/${t.id}`}
                          className="hover:underline"
                          style={{ color: "inherit" }}
                        >
                          {t.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
                        {t.projectName || "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
                        {t.agencyName}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
                        {formatEcheance(t.deadline)}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={STATUS_STYLE[status]}
                        >
                          {statusIcon(status)} {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {taches.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Aucune tâche ne vous est assignée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

        <motion.div variants={item} className="grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
              <ShieldCheck size={18} /> Sécurité
            </h2>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
            >
              <Mail size={16} style={{ color: "var(--text-secondary)" }} />
              <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{infos.email}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--color-success)" }}>
                <CheckCircle2 size={13} /> Vérifié
              </span>
            </div>
            <Link
              href="/modifier-mot-de-passe"
              className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:opacity-80"
              style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            >
              <Pencil size={15} style={{ color: "var(--text-secondary)" }} />
              Changer mon mot de passe
            </Link>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
              <Globe size={18} /> Préférences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide block mb-1" style={{ color: "var(--text-secondary)" }}>
                  Langue
                </label>
                <CustomSelectField
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { value: "fr", label: "Français" },
                    { value: "en", label: "English" },
                  ]}
                  className="w-full"
                  ariaLabel="Langue"
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Bell size={15} style={{ color: "var(--text-secondary)" }} /> Notifications
                </span>
                {(Object.keys(LABEL_NOTIFICATION_PREFERENCE) as (keyof NotificationPreferences)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleNotifPref(key)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
                  >
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {LABEL_NOTIFICATION_PREFERENCE[key]}
                    </span>
                    <span
                      className="w-10 h-6 rounded-full relative transition-colors shrink-0"
                      style={{ background: notifPrefs[key] ? "var(--gradient-button)" : "var(--border-subtle)" }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                        style={{ left: notifPrefs[key] ? "19px" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                      />
                    </span>
                  </button>
                ))}
                {notifPrefsError && (
                  <p className="text-xs font-semibold" style={{ color: "var(--color-error)" }}>
                    {notifPrefsError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Ajuster la photo</h3>
              <button onClick={() => setSelectedImage(null)} aria-label="Fermer">
                <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <div className="relative h-80 md:h-96">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <ZoomIn size={18} style={{ color: "var(--text-secondary)" }} />
                <CustomSlider
                  value={zoom}
                  onChange={setZoom}
                  min={1}
                  max={3}
                  step={0.1}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleApplyCrop}
                  disabled={cropping}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "var(--gradient-button)", boxShadow: "0 5px 14px -5px rgba(37,99,235,0.4)" }}
                >
                  <CheckCircle2 size={15} /> {cropping ? "Traitement..." : "Valider"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AvatarViewer
        open={viewerOpen}
        src={avatarUrl}
        onClose={() => setViewerOpen(false)}
        onCrop={
          lastRaw
            ? () => {
                setViewerOpen(false);
                reopenCrop();
              }
            : undefined
        }
      />
    </>
  );
}