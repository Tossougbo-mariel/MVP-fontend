"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, type Href } from "@/i18n/navigation";
import { taskHref } from "@/lib/projectHref";
import { useLocale, useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";
import { AlertTriangle, CalendarClock, BellRing, CheckSquare } from "lucide-react";
import { useAppData } from "@/lib/appData";
import type { DeadlineAlert } from "@/app/store/deadlineAlertStore";
import {
  activeDeadlineAlerts,
  deadlineAlertLabel,
  deadlineAlertTone,
  formatDueDate,
} from "@/lib/deadlineAlerts";

/** Recalcul des libellés (« demain / dans 2 jours »), comme la bannière. */
const REFRESH_MS = 10 * 60 * 1000;

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { y: 12, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

type Filter = "toutes" | "retard" | "bientot";

type DeadlineAlertsViewProps = {
  /** Restreint la liste aux alertes d'une agence. */
  agencyId?: number | string | null;
  /** Résumé affiché sous le titre (nom de l'agence…). */
  subtitle?: string;
};

/**
 * Page des alertes d'échéance : la liste complète des tâches en retard ou
 * proches de leur échéance, calculée en direct sur les tâches chargées (et non
 * sur la copie rafraîchie toutes les 10 minutes de la bannière) pour qu'une
 * tâche cochée comme terminée disparaisse aussitôt.
 */
export default function DeadlineAlertsView({ agencyId = null, subtitle }: DeadlineAlertsViewProps) {
  const { data, getProject, agencyById } = useAppData();
  const locale = useLocale();
  const t = useTranslations("Deadlines");
  const [filter, setFilter] = useState<Filter>("toutes");

  // L'alerte se calcule sur l'heure courante : un point de repère toutes les
  // 10 minutes suffit à rafraîchir « demain / dans 2 jours » sans dépendre de
  // la copie entretenue par la bannière.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  const scoped = useMemo(() => {
    const alerts = activeDeadlineAlerts(data.tasks, now, locale);
    if (agencyId == null) return alerts;
    return alerts.filter((alert) => {
      const project = getProject(alert.projectId);
      return project != null && Number(project.agencyId) === Number(agencyId);
    });
  }, [data.tasks, agencyId, getProject, now, locale]);

  const counts = useMemo(
    () => ({
      toutes: scoped.length,
      retard: scoped.filter((a) => a.stage === "retard").length,
      bientot: scoped.filter((a) => a.stage === "bientot").length,
    }),
    [scoped],
  );

  const visible = useMemo(
    () => (filter === "toutes" ? scoped : scoped.filter((a) => a.stage === filter)),
    [scoped, filter],
  );

  const chips: { key: Filter; label: string }[] = [
    { key: "toutes", label: t("all") },
    { key: "retard", label: t("overdue") },
    { key: "bientot", label: t("dueSoon") },
  ];

  const hrefFor = (alert: DeadlineAlert): Href | null => {
    const project = getProject(alert.projectId);
    if (!project) return null;
    return taskHref(project.agencyId, project.id, alert.taskId);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <BellRing className="w-5 h-5 text-white" />
          </span>
          <div className="min-w-0">
            <h1
              className="text-2xl lg:text-3xl font-black tracking-tight"
              style={{ color: "var(--chrome-text)" }}
            >
              {t("menuTitle")}
            </h1>
            <p className="text-sm truncate" style={{ color: "var(--chrome-text-secondary)" }}>
              {subtitle}
              {subtitle ? " · " : ""}
              {t("watchCount", { count: scoped.length })}
              {counts.retard > 0 && (
                <span className="font-semibold" style={{ color: "var(--color-error)" }}>
                  {" "}· {t("lateCount", { count: counts.retard })}
                </span>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {chips.map((chip) => {
          const active = filter === chip.key;
          const count = counts[chip.key];
          return (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={
                active
                  ? { background: "var(--chrome-accent-soft)", color: "var(--chrome-accent-text)" }
                  : {
                      background: "var(--chrome-card)",
                      border: "1px solid var(--chrome-border)",
                      color: "var(--chrome-text-secondary)",
                    }
              }
            >
              {chip.label}
              <span
                className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={
                  active
                    ? { background: "var(--blue)", color: "#fff" }
                    : { background: "var(--chrome-hover)", color: "var(--chrome-text-muted)" }
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {data.loading && scoped.length === 0 ? (
        <motion.p
          variants={item}
          className="text-sm text-center py-12"
          style={{ color: "var(--chrome-text-muted)" }}
        >
          {t("loading")}
        </motion.p>
      ) : visible.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center gap-4 min-h-[34vh] text-center"
        >
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--chrome-card)", border: "1px solid var(--chrome-border)" }}
          >
            {filter === "retard" ? (
              <AlertTriangle className="w-7 h-7" style={{ color: "var(--chrome-text-muted)" }} />
            ) : (
              <CheckSquare className="w-7 h-7" style={{ color: "var(--chrome-text-muted)" }} />
            )}
          </span>
          <div>
            <p className="font-semibold" style={{ color: "var(--chrome-text)" }}>
              {filter === "toutes" ? t("emptyTitle") : t("emptyFilterTitle")}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--chrome-text-muted)" }}>
              {filter === "toutes" ? t("emptyText") : t("emptyFilterText")}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {visible.map((alert) => {
            const tone = deadlineAlertTone(alert);
            const label = deadlineAlertLabel(alert, locale);
            const Icon = alert.stage === "retard" ? AlertTriangle : CalendarClock;
            const project = getProject(alert.projectId);
            const agency = project ? agencyById(project.agencyId) : undefined;
            const href = hrefFor(alert);

            return (
              <motion.div
                key={`${alert.taskId}:${alert.stage}`}
                variants={item}
                className="glass rounded-xl p-3"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: tone.bg, color: tone.color }}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </span>

                  <div className="flex-1 min-w-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{ background: tone.bg, color: tone.color }}
                        >
                          {t(label.key, label.params)}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--chrome-text-muted)" }}>
                          {t("dueOn", { date: formatDueDate(alert.dueDate, locale) })}
                        </span>
                        {project && (
                          <span className="text-[10px]" style={{ color: "var(--chrome-text-muted)" }}>
                            · {project.name}
                            {agency ? ` — ${agency.name}` : ""}
                          </span>
                        )}
                      </div>

                      <p
                        className="mt-1 text-[13px] font-semibold"
                        style={{ color: "var(--chrome-text)" }}
                      >
                        {alert.taskTitle}
                      </p>
                      <p className="mt-0.5 text-[11px] line-clamp-2" style={{ color: "var(--chrome-text-muted)" }}>
                        {t(alert.messageKey, alert.params)}
                      </p>
                    </div>

                    {href && (
                      <Link
                        href={href}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-transform hover:scale-[1.03] active:scale-95"
                        style={{
                          background: "var(--chrome-card)",
                          border: "1px solid var(--chrome-border)",
                          color: "var(--chrome-text-secondary)",
                        }}
                      >
                        {t("viewTask")}
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
