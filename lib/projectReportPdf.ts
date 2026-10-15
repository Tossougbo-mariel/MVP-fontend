// ============================================================
// Générateur du « Rapport de projet » au format PDF.
//
// La mise en page reprend fidèlement la maquette « Bilan du mois »
// (fichier momo.pdf) : bandeau marine à rayons, encart de synthèse vert,
// tableau des indicateurs avec pastilles BIEN / ATTENTION, barres de
// progression, synthèse d'équipe et recommandations.
//
// Le rendu est vectoriel et utilise la police Helvetica standard (identiqu
// à momo.pdf). jsPDF est importé dynamiquement pour ne pas alourdir le
// bundle initial et rester compatible avec le rendu serveur de Next.js.
// ============================================================
import type {
  Agency,
  Project,
  ProjectMember,
  Task,
  TaskStatusMeta,
} from "./types";
import type { jsPDF } from "jspdf";
import { getProjectProgress, isTerminalStatus, taskStatusLabel } from "./types";
import {
  BAR_TRACK,
  BORDER,
  DEFAULT_COLOR,
  DEFAULT_TEMPLATE,
  ReportCanvas,
  TEXT_DARK,
  TEXT_MUTED,
  TONE_WARN,
  paletteFromHex,
  type ReportOptions,
  type ReportPalette,
  type ReportTemplateId,
  type Tone,
} from "./reportTheme";

// ---------- Modèle de données du rapport ----------
export type ProjectReportInput = {
  project: Project;
  agency?: Agency | null;
  tasks: Task[];
  projectMembers: ProjectMember[];
  statuses: TaskStatusMeta[];
  now?: Date;
};

type MetricItem = {
  value: string;
  label: string;
  tone: Tone;
};

type TaskRow = {
  name: string;
  pct: number;
  tone: Tone;
  situation: string;
  detail: string;
};

type TeamRow = {
  badge: string;
  tone: Tone;
  lead: string;
  rest: string;
};

type ReportModel = {
  title: string;
  subtitle: string;
  overviewVerdict: string;
  overviewTone: Tone;
  overviewSentence: string;
  metrics: MetricItem[];
  tasks: TaskRow[];
  tasksTotal: number;
  team: TeamRow[];
  actions: string[];
  footerLeft: string;
  footerRight: string;
};

// ---------- Utilitaires ----------
const DAY = 86400000;

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const dayStart = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const fmtLongDate = (d: Date): string => {
  const s = d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const fmtShortDate = (value?: string | null): string => {
  const d = parseDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
};

const plural = (n: number, one: string, many: string): string =>
  `${n} ${n > 1 ? many : one}`;

const withDot = (s: string): string => (s.endsWith(".") ? s : `${s}.`);

const memberName = (m: ProjectMember): string => {
  const full = `${m.user.firstName} ${m.user.lastName}`.trim();
  return full || m.user.name || m.user.email;
};

// ---------- Construction du modèle ----------
const buildModel = (input: ProjectReportInput): ReportModel => {
  const { project, agency, tasks, projectMembers, statuses } = input;
  const now = input.now ?? new Date();
  const today = dayStart(now);

  const isDone = (t: Task) => isTerminalStatus(t.status, statuses);

  // Progression pondérée par la position du statut (identique au Kanban).
  const progressCredits: Record<string, number> = {};
  const lastIndex = Math.max(0, statuses.length - 1);
  statuses.forEach((s, i) => {
    progressCredits[s.key] = s.is_terminal || lastIndex === 0 ? 100 : Math.round((i / lastIndex) * 100);
  });
  const pctOf = (t: Task) =>
    isDone(t) ? 100 : progressCredits[t.status] ?? 0;

  const isOverdue = (t: Task): boolean => {
    if (isDone(t)) return false;
    if (t.deadlineStatus === "en_retard") return true;
    const due = parseDate(t.dueDate);
    return !!due && due < today;
  };
  const overdueDays = (t: Task): number => {
    const due = parseDate(t.dueDate);
    if (!due) return 0;
    return Math.max(0, Math.round((today.getTime() - due.getTime()) / DAY));
  };

  const total = tasks.length;
  const done = tasks.filter(isDone);
  const doneCount = done.length;
  const overdue = tasks.filter(isOverdue);
  const overdueCount = overdue.length;
  const projectProgress = getProjectProgress(tasks, statuses);

  // « À temps » : tâche close dont la date de fin précède l'échéance.
  const onTimeCount = done.filter((t) => {
    const due = parseDate(t.dueDate);
    if (!due) return true;
    const completed = parseDate(t.completedAt);
    if (!completed) return !isOverdue(t);
    return dayStart(completed) <= dayStart(due);
  }).length;
  const onTimeRate = doneCount === 0 ? 0 : Math.round((onTimeCount / doneCount) * 100);

  // Délai moyen de traitement (création → clôture).
  const durations = done
    .map((t) => {
      const a = parseDate(t.createdAt);
      const b = parseDate(t.completedAt);
      if (!a || !b) return null;
      return Math.max(0, (b.getTime() - a.getTime()) / DAY);
    })
    .filter((n): n is number => n !== null);
  const avgDays =
    durations.length === 0
      ? null
      : Math.max(1, Math.round(durations.reduce((s, n) => s + n, 0) / durations.length));

  // ---- Synthèse générale ----
  // Le verdict varie selon l'évolution réelle du projet (avancement + retards),
  // du plus favorable (« BON ») au plus préoccupant (« FRAGILE »).
  const overdueRatio = total === 0 ? 0 : overdueCount / total;
  let overviewVerdict: string;
  let overviewTone: Tone;
  if (total === 0) {
    overviewVerdict = "À DÉMARRER";
    overviewTone = "info";
  } else if (projectProgress >= 80 && overdueCount === 0) {
    overviewVerdict = "BON";
    overviewTone = "good";
  } else if (projectProgress >= 50) {
    overviewVerdict = "EN BONNE VOIE";
    overviewTone = "info";
  } else if (overdueCount >= 4 || overdueRatio >= 0.4) {
    overviewVerdict = "FRAGILE";
    overviewTone = "bad";
  } else {
    overviewVerdict = "À AMÉLIORER";
    overviewTone = "warn";
  }

  const restantes = total - doneCount;
  let overviewSentence: string;
  if (total === 0) {
    overviewSentence =
      "Ce projet ne contient encore aucune tâche. Dès que des tâches seront créées, leur avancement apparaîtra ici.";
  } else if (overviewVerdict === "BON") {
    overviewSentence = `Le projet est à ${projectProgress} % d'avancement : ${plural(doneCount, "tâche terminée", "tâches terminées")} sur ${total}, et aucune échéance n'est dépassée.`;
  } else if (overviewVerdict === "EN BONNE VOIE") {
    overviewSentence =
      overdueCount > 0
        ? `Le projet progresse bien (${projectProgress} %), mais ${plural(overdueCount, "tâche dépasse", "tâches dépassent")} ${overdueCount > 1 ? "leur" : "son"} échéance.`
        : `Le projet progresse bien : ${projectProgress} % d'avancement, ${plural(doneCount, "tâche terminée", "tâches terminées")} sur ${total}.`;
  } else if (overviewVerdict === "FRAGILE") {
    overviewSentence = `Le projet n'avance qu'à ${projectProgress} % et ${plural(overdueCount, "tâche est en retard", "tâches sont en retard")}. Un suivi rapproché est nécessaire.`;
  } else {
    overviewSentence = `Le projet est à ${projectProgress} % d'avancement ; ${plural(restantes, "tâche reste", "tâches restent")} à traiter pour le mener à bien.`;
  }

  // ---- Chiffres clés ----
  const ratioTone = (v: number, goodAt: number, infoAt: number): Tone =>
    v >= goodAt ? "good" : v >= infoAt ? "info" : "warn";
  const metrics: MetricItem[] = [
    {
      label: "Avancement global",
      value: `${projectProgress} %`,
      tone: overviewTone,
    },
    {
      label: "Tâches terminées",
      value: `${doneCount} / ${total}`,
      tone: total === 0 ? "info" : ratioTone(Math.round((doneCount / total) * 100), 80, 50),
    },
    {
      label: "Respect des délais",
      value: doneCount === 0 ? "—" : `${onTimeRate} %`,
      tone: doneCount === 0 ? "info" : ratioTone(onTimeRate, 85, 60),
    },
    {
      label: "Délai moyen",
      value: avgDays === null ? "—" : `${avgDays} ${avgDays > 1 ? "jours" : "jour"}`,
      tone:
        avgDays === null
          ? "info"
          : avgDays <= 7
            ? "good"
            : avgDays <= 14
              ? "info"
              : "warn",
    },
    {
      label: "Tâches en retard",
      value: `${overdueCount}`,
      tone: overdueCount === 0 ? "good" : overdueCount >= 3 ? "bad" : "warn",
    },
    {
      label: "Tâches restantes",
      value: `${restantes}`,
      tone: restantes === 0 ? "good" : "info",
    },
  ];

  // ---- Où en sont les tâches ? ----
  const taskRows: TaskRow[] = [...tasks]
    .sort((a, b) => {
      const ao = isOverdue(a) ? 0 : 1;
      const bo = isOverdue(b) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      if (ao === 0) return overdueDays(b) - overdueDays(a);
      const ad = parseDate(a.dueDate)?.getTime() ?? Infinity;
      const bd = parseDate(b.dueDate)?.getTime() ?? Infinity;
      if (ad !== bd) return ad - bd;
      return a.title.localeCompare(b.title);
    })
    .map((t) => {
      const pct = pctOf(t);
      const over = isOverdue(t);
      const tone: Tone = over ? "warn" : "good";
      let situation: string;
      if (isDone(t)) situation = "Terminé";
      else if (over) situation = "À surveiller";
      else if (pct >= 90) situation = "Presque fini";
      else if (pct >= 50) situation = "En bonne voie";
      else situation = "Démarré";

      let detail: string;
      if (over) detail = `${overdueDays(t)} j de retard`;
      else if (isDone(t)) detail = "Terminé";
      else if (t.dueDate) detail = `Échéance ${fmtShortDate(t.dueDate)}`;
      else detail = taskStatusLabel(t.status, statuses);
      return { name: t.title, pct, tone, situation, detail };
    });

  // ---- Et l'équipe ? ----
  type Stat = {
    name: string;
    assigned: number;
    done: number;
    onTime: number;
    overdue: number;
    open: number;
  };
  const statByEmail = new Map<string, Stat>();
  const rosterByEmail = new Map<string, string>();
  // Tâches rattachées à chaque personne, pour détailler le travail assigné.
  const tasksByEmail = new Map<string, Task[]>();
  projectMembers.forEach((m) => {
    const key = m.user.email.toLowerCase();
    rosterByEmail.set(key, memberName(m));
    statByEmail.set(key, {
      name: memberName(m),
      assigned: 0,
      done: 0,
      onTime: 0,
      overdue: 0,
      open: 0,
    });
  });
  tasks.forEach((t) => {
    const key = (t.assigneeEmail ?? "").toLowerCase();
    if (!key) return;
    const bucket = tasksByEmail.get(key);
    if (bucket) bucket.push(t);
    else tasksByEmail.set(key, [t]);
    let stat = statByEmail.get(key);
    if (!stat) {
      stat = {
        name: t.assigneeName || t.assigneeEmail || "—",
        assigned: 0,
        done: 0,
        onTime: 0,
        overdue: 0,
        open: 0,
      };
      statByEmail.set(key, stat);
    }
    stat.assigned += 1;
    if (isDone(t)) {
      stat.done += 1;
      const due = parseDate(t.dueDate);
      const completed = parseDate(t.completedAt);
      if (!due || !completed || dayStart(completed) <= dayStart(due)) stat.onTime += 1;
    } else {
      stat.open += 1;
      if (isOverdue(t)) stat.overdue += 1;
    }
  });
  const stats = [...statByEmail.values()].filter((s) => s.assigned > 0);

  const team: TeamRow[] = [];
  const reliable = [...stats]
    .filter((s) => s.done > 0)
    .sort((a, b) => b.onTime / b.done - a.onTime / a.done || b.done - a.done);
  if (reliable.length > 0) {
    const best = reliable[0];
    const rate = Math.round((best.onTime / best.done) * 100);
    const others = reliable
      .slice(1)
      .filter((s) => Math.round((s.onTime / s.done) * 100) >= rate - 5)
      .slice(0, 1)
      .map((s) => s.name);
    const names = [best.name, ...others].join(" et ");
    team.push({
      badge: "BIEN",
      tone: "good",
      lead: withDot(`Les plus réguliers : ${names}`),
      rest: ` ${rate} % de leurs tâches sont finies à temps (${best.done} terminée${best.done > 1 ? "s" : ""}).`,
    });
  }
  const toSupport = [...stats]
    .filter((s) => s.overdue > 0 || s.open >= 3)
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open)[0];
  if (toSupport) {
    team.push({
      badge: "ATTENTION",
      tone: "warn",
      lead: withDot(`À soutenir : ${toSupport.name}`),
      rest: ` ${
        toSupport.open > 0 ? `${toSupport.open} tâche${toSupport.open > 1 ? "s" : ""} encore ouverte${toSupport.open > 1 ? "s" : ""}` : "Aucune tâche ouverte"
      }${toSupport.overdue > 0 ? `, dont ${toSupport.overdue} en retard` : ""}.`,
    });
  }

  // Récapitulatif des affectations : chaque personne rattachée au projet et
  // les tâches qui lui sont assignées. Affiché même quand rien n'a encore
  // bougé (projet non démarré, aucune carte déplacée dans le kanban).
  [...statByEmail.entries()].forEach(([email, s]) => {
    const list = tasksByEmail.get(email) ?? [];
    const tone: Tone = s.overdue > 0 ? "bad" : s.assigned > 0 && s.open === 0 ? "good" : "info";
    const tasksLabel =
      list.length === 0
        ? "aucune tâche assignée."
        : `${list
            .map((t) => {
              const flag = isDone(t)
                ? "terminé"
                : isOverdue(t)
                  ? "en retard"
                  : taskStatusLabel(t.status, statuses).toLowerCase();
              return `« ${t.title} » (${flag})`;
            })
            .join(", ")}.`;
    team.push({
      badge: `${s.assigned}`,
      tone,
      lead: withDot(s.name),
      rest: ` ${tasksLabel}`,
    });
  });

  if (team.length === 0) {
    team.push({
      badge: "BIEN",
      tone: "good",
      lead: "Aucune tâche assignée.",
      rest: " Attribuez des tâches aux membres pour suivre la charge de l'équipe.",
    });
  }

  // ---- Que faire maintenant ? ----
  const actions: string[] = [];
  const worst = [...overdue].sort((a, b) => overdueDays(b) - overdueDays(a))[0];
  if (worst) {
    actions.push(
      `Traiter en priorité : ${worst.title} (${overdueDays(worst)} j de retard).`,
    );
  }
  if (toSupport && toSupport.open >= 2 && reliable.length > 0) {
    const helper = reliable[0].name;
    const give = Math.min(3, toSupport.open);
    actions.push(
      withDot(`Répartir ${give} tâche${give > 1 ? "s" : ""} de ${toSupport.name} vers ${helper}`),
    );
  } else if (overdueCount > 1) {
    actions.push(
      `Replanifier les ${overdueCount} tâches en retard et prévenir les responsables.`,
    );
  }
  if (project.dueDate) {
    const due = parseDate(project.dueDate);
    if (due) {
      const daysLeft = Math.round((due.getTime() - today.getTime()) / DAY);
      actions.push(
        daysLeft >= 0
          ? `Suivre le projet chaque semaine : échéance le ${fmtLongDate(due)} (dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}).`
          : `L'échéance du projet (${fmtLongDate(due)}) est dépassée de ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? "s" : ""}.`,
      );
    }
  }
  if (actions.length === 0) {
    actions.push("Poursuivre au rythme actuel : le projet est à jour.");
  }

  const subtitle = `${agency?.name ?? "Agence"}  |  ${plural(total, "tâche", "tâches")}, ${plural(stats.length, "personne", "personnes")}`;

  return {
    title: `${project.name} en un coup d'œil`,
    subtitle,
    overviewVerdict,
    overviewTone,
    overviewSentence,
    metrics,
    tasks: taskRows,
    tasksTotal: total,
    team,
    actions: actions.slice(0, 3),
    footerLeft: "Document généré par TaskFlow.",
    footerRight: `Édition du ${fmtLongDate(now)}`,
  };
};

// ---------- Rendu ----------
const renderReport = (
  doc: jsPDF,
  model: ReportModel,
  palette: ReportPalette,
  template: ReportTemplateId,
): void => {
  const c = new ReportCanvas(doc, palette, template);
  c.footerLeft = model.footerLeft;
  c.footerRight = model.footerRight;

  // ===== En-tête =====
  c.banner("Rapport de projet", model.title, model.subtitle, true);

  // ===== Encart de synthèse =====
  c.highlightCard({
    eyebrow: "Le projet est",
    value: model.overviewVerdict,
    tone: model.overviewTone,
    sentence: model.overviewSentence,
  });

  // ===== Les chiffres clés =====
  c.section("Les chiffres clés");
  c.kpiGrid(model.metrics);

  // ===== Où en sont les tâches ? =====
  c.section("Où en sont les tâches ?");

  const drawTaskHeader = (): number => {
    const h = c.y + 12;
    c.font("bold", 8.5).setText(TEXT_MUTED);
    c.write("TÂCHE", c.M, h);
    c.write("AVANCEMENT", 170, h);
    c.write("SITUATION", 386, h);
    c.write("ÉCHÉANCE", 468, h);
    return c.y + 21;
  };

  let rowTop = drawTaskHeader();

  if (model.tasks.length === 0) {
    c.hlineAt(rowTop, BORDER, 0.4);
    c.font("normal", 10).setText(TEXT_MUTED);
    c.write("Aucune tâche dans ce projet.", c.M, rowTop + 16);
    rowTop += 24;
  }

  model.tasks.forEach((t) => {
    if (rowTop + 24 > c.BOTTOM) {
      c.addPage();
      rowTop = drawTaskHeader();
    }
    c.hlineAt(rowTop, BORDER, 0.4);
    const baseline = rowTop + 16;

    c.font("bold", 10).setText(TEXT_DARK);
    c.write(c.truncate(t.name, 170 - 60 - 6), c.M, baseline);

    // Barre de progression
    c.setFill(BAR_TRACK).doc.rect(170, baseline - 10, 170, 10, "F");
    const fillW = Math.max(0, Math.min(170, (170 * t.pct) / 100));
    if (fillW > 0) {
      c.setFill(c.toneColor(t.tone)).doc.rect(170, baseline - 10, fillW, 10, "F");
    }
    c.font("bold", 10).setText(TEXT_DARK);
    c.write(`${t.pct} %`, 369, baseline, { align: "right" });

    c.font("bold", 10).setText(c.toneColor(t.tone));
    c.write(t.situation, 386, baseline);

    c.font("normal", 9.2).setText(t.tone === "warn" ? TONE_WARN : TEXT_DARK);
    c.write(c.truncate(t.detail, c.RIGHT - 468), 468, baseline);

    rowTop += 24;
  });
  c.y = rowTop;

  // Note sous le tableau
  c.y += 13;
  c.font("normal", 9).setText(TEXT_MUTED);
  c.write("100 % = tâche terminée. Orange = échéance dépassée.", c.M, c.y);

  // ===== Et l'équipe ? =====
  c.section("Et l'équipe ?");
  model.team.forEach((row, idx) => {
    c.flowRow({
      badge: row.badge,
      badgeTone: row.tone,
      lead: row.lead,
      rest: row.rest,
      index: idx,
    });
  });

  // ===== Que faire maintenant ? =====
  c.section("Que faire maintenant ?");
  model.actions.forEach((action, idx) => {
    c.font("normal", 10);
    const lines = doc.splitTextToSize(action, c.RIGHT - 88) as string[];
    const rowH = 13 * lines.length + 12;
    c.ensureSpace(rowH);
    const baseline = c.y + 15;
    c.font("bold", 15).setText(palette.baseDark);
    c.write(String(idx + 1), c.M + 3, baseline);
    c.font("normal", 10).setText(TEXT_DARK);
    lines.forEach((line, i) => c.write(line, 88, baseline + i * 13));
    c.y += rowH;
  });

  c.finish();
};

// ---------- Nom de fichier ----------
const slugify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export const projectReportFileName = (project: Project): string =>
  `rapport-${slugify(project.name) || "projet"}.pdf`;

// ---------- API publique ----------
export async function buildProjectReportPdf(
  input: ProjectReportInput,
  options: ReportOptions = {},
): Promise<jsPDF> {
  const model = buildModel(input);
  const { jsPDF: JsPdf } = await import("jspdf");
  const doc = new JsPdf({ unit: "pt", format: "a4" });
  renderReport(
    doc,
    model,
    paletteFromHex(options.color ?? DEFAULT_COLOR),
    options.template ?? DEFAULT_TEMPLATE,
  );
  return doc;
}

export async function exportProjectReportPdf(
  input: ProjectReportInput,
  options: ReportOptions = {},
): Promise<void> {
  const doc = await buildProjectReportPdf(input, options);
  doc.save(projectReportFileName(input.project));
}
