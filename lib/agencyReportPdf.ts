// ============================================================
// Générateur du « Rapport d'agence » au format PDF.
//
// Agrège tous les projets et tâches d'une agence : avancement global,
// tableau des projets, synthèse d'équipe et recommandations.
//
// Le rendu s'appuie sur le socle commun `ReportCanvas` (lib/reportTheme.ts),
// qui gère les gabarits et la couleur de base choisie par l'utilisateur.
// jsPDF est importé dynamiquement pour ne pas alourdir le bundle initial.
// ============================================================
import type { Agency, Project, Task, TaskStatusMeta } from "./types";
import type { jsPDF } from "jspdf";
import { getProjectProgress, isTerminalStatus } from "./types";
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

export type AgencyReportData = {
  projects: Project[];
  tasks: Task[];
  statuses: TaskStatusMeta[];
  now?: Date;
};

type MetricItem = { value: string; label: string; tone: Tone };

type ProjectRow = {
  name: string;
  pct: number;
  tone: Tone;
  done: number;
  total: number;
  overdue: number;
};

type MemberRow = {
  lead: string;
  rest: string;
  badge: string;
  tone: Tone;
};

type AgencyReportModel = {
  title: string;
  subtitle: string;
  overviewVerdict: string;
  overviewTone: Tone;
  overviewSentence: string;
  metrics: MetricItem[];
  projects: ProjectRow[];
  members: MemberRow[];
  actions: string[];
  footerLeft: string;
  footerRight: string;
};

// ---------- Utilitaires ----------
const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const dayStart = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const fmtLongDate = (d: Date): string => {
  const s = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const ratioTone = (v: number, goodAt: number, infoAt: number): Tone =>
  v >= goodAt ? "good" : v >= infoAt ? "info" : "warn";

const memberLabel = (name: string | null, email: string | null): string =>
  (name ?? "").trim() || (email ?? "").trim() || "Membre";

// ---------- Construction du modèle ----------
const buildModel = (input: { agency: Agency } & AgencyReportData): AgencyReportModel => {
  const { agency, projects, tasks, statuses } = input;
  const now = input.now ?? new Date();
  const today = dayStart(now);

  const isDone = (t: Task): boolean => isTerminalStatus(t.status, statuses);
  const isOverdue = (t: Task): boolean => {
    if (isDone(t)) return false;
    if (t.deadlineStatus === "en_retard") return true;
    const due = parseDate(t.dueDate);
    return due ? dayStart(due).getTime() < today.getTime() : false;
  };

  const total = tasks.length;
  const doneCount = tasks.filter(isDone).length;
  const overdueCount = tasks.filter(isOverdue).length;

  const projectStats = projects.map((p) => {
    const pt = tasks.filter((t) => Number(t.projectId) === Number(p.id));
    return {
      project: p,
      total: pt.length,
      done: pt.filter(isDone).length,
      overdue: pt.filter(isOverdue).length,
      pct: getProjectProgress(pt, statuses),
    };
  });

  const globalProgress =
    total === 0
      ? 0
      : Math.round((projectStats.reduce((acc, s) => acc + (s.pct / 100) * s.total, 0) / total) * 100);

  const atRisk = projectStats.filter((s) => s.overdue > 0 && s.pct < 60);

  // ---- Synthèse générale ----
  const overdueRatio = total === 0 ? 0 : overdueCount / total;
  let overviewVerdict: string;
  let overviewTone: Tone;
  if (total === 0) {
    overviewVerdict = "À DÉMARRER";
    overviewTone = "info";
  } else if (globalProgress >= 80 && overdueCount === 0) {
    overviewVerdict = "BON";
    overviewTone = "good";
  } else if (globalProgress >= 50 && overdueRatio < 0.2) {
    overviewVerdict = "EN BONNE VOIE";
    overviewTone = "info";
  } else if (overdueCount >= 4 || overdueRatio >= 0.4) {
    overviewVerdict = "FRAGILE";
    overviewTone = "bad";
  } else {
    overviewVerdict = "À AMÉLIORER";
    overviewTone = "warn";
  }

  let overviewSentence: string;
  if (total === 0) {
    overviewSentence =
      "L'agence ne contient encore aucune tâche. Dès que des projets seront lancés, leur avancement apparaîtra ici.";
  } else if (overviewVerdict === "BON") {
    overviewSentence = `L'agence est à ${globalProgress} % d'avancement sur ${plural(projects.length, "projet", "projets")}, sans aucune échéance dépassée.`;
  } else if (overviewVerdict === "EN BONNE VOIE") {
    overviewSentence = `L'agence progresse bien (${globalProgress} %), avec ${plural(overdueCount, "échéance dépassée", "échéances dépassées")} à surveiller.`;
  } else if (overviewVerdict === "FRAGILE") {
    overviewSentence = `L'agence n'avance qu'à ${globalProgress} % et ${plural(overdueCount, "tâche est en retard", "tâches sont en retard")}. Un suivi rapproché est nécessaire.`;
  } else {
    overviewSentence = `L'agence est à ${globalProgress} % d'avancement ; ${plural(overdueCount, "tâche dépasse", "tâches dépassent")} ${overdueCount > 1 ? "leur" : "son"} échéance.`;
  }

  // ---- Chiffres clés ----
  const metrics: MetricItem[] = [
    { label: "Avancement global", value: `${globalProgress} %`, tone: overviewTone },
    { label: "Projets actifs", value: `${projects.length}`, tone: "info" },
    {
      label: "Tâches terminées",
      value: `${doneCount} / ${total}`,
      tone: total === 0 ? "info" : ratioTone(Math.round((doneCount / total) * 100), 80, 50),
    },
    {
      label: "Tâches en retard",
      value: `${overdueCount}`,
      tone: overdueCount === 0 ? "good" : overdueCount >= 3 ? "bad" : "warn",
    },
    { label: "Membres", value: `${agency.members.length}`, tone: "info" },
    {
      label: "Projets à risque",
      value: `${atRisk.length}`,
      tone: atRisk.length === 0 ? "good" : atRisk.length >= 2 ? "bad" : "warn",
    },
  ];

  // ---- Les projets ----
  const projectRows: ProjectRow[] = projectStats
    .map((s) => ({
      name: s.project.name,
      pct: s.pct,
      tone: (s.overdue > 0 ? "warn" : s.pct >= 80 ? "good" : "info") as Tone,
      done: s.done,
      total: s.total,
      overdue: s.overdue,
    }))
    .sort((a, b) => {
      const ao = a.overdue > 0 ? 0 : 1;
      const bo = b.overdue > 0 ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return a.pct - b.pct;
    });

  // ---- Équipe ----
  const statByPerson = new Map<
    string,
    { name: string; assigned: number; done: number; overdue: number }
  >();
  tasks.forEach((t) => {
    if (!t.assigneeEmail && !t.assignedTo) return;
    const key = (t.assigneeEmail ?? `id:${t.assignedTo}`).toLowerCase();
    const cur =
      statByPerson.get(key) ??
      { name: memberLabel(t.assigneeName, t.assigneeEmail), assigned: 0, done: 0, overdue: 0 };
    cur.assigned += 1;
    if (isDone(t)) cur.done += 1;
    if (isOverdue(t)) cur.overdue += 1;
    statByPerson.set(key, cur);
  });

  const members: MemberRow[] = [...statByPerson.values()]
    .sort((a, b) => b.assigned - a.assigned || a.name.localeCompare(b.name))
    .map((s) => {
      const bits = [`${s.assigned} ${s.assigned > 1 ? "tâches" : "tâche"}`];
      if (s.done > 0) bits.push(`${s.done} terminée${s.done > 1 ? "s" : ""}`);
      if (s.overdue > 0) bits.push(`${s.overdue} en retard`);
      return {
        lead: `${s.name} :`,
        rest: `${bits.join(", ")}.`,
        badge: `${s.assigned}`,
        tone: (s.overdue > 0 ? "warn" : "good") as Tone,
      };
    });

  // ---- Que faire maintenant ? ----
  const actions: string[] = [];
  if (overdueCount > 0) {
    actions.push(
      `Traiter en priorité les ${plural(overdueCount, "tâche en retard", "tâches en retard")} : revoir les échéances ou réaffecter les responsables.`,
    );
  }
  if (atRisk.length > 0) {
    actions.push(
      `Faire un point sur ${plural(atRisk.length, "projet à risque", "projets à risque")} : ${atRisk
        .slice(0, 3)
        .map((s) => s.project.name)
        .join(", ")}.`,
    );
  }
  if (actions.length === 0) {
    actions.push(
      total === 0
        ? "Lancer un premier projet pour commencer à suivre l'activité de l'agence."
        : "Maintenir le rythme actuel et anticiper les prochaines échéances.",
    );
  }

  return {
    title: agency.name,
    subtitle: `${plural(projects.length, "projet", "projets")} · ${plural(agency.members.length, "membre", "membres")}`,
    overviewVerdict,
    overviewTone,
    overviewSentence,
    metrics,
    projects: projectRows,
    members,
    actions: actions.slice(0, 3),
    footerLeft: "Document généré par TaskFlow.",
    footerRight: `Édition du ${fmtLongDate(now)}`,
  };
};

// ---------- Rendu ----------
const renderReport = (
  doc: jsPDF,
  model: AgencyReportModel,
  palette: ReportPalette,
  template: ReportTemplateId,
): void => {
  const c = new ReportCanvas(doc, palette, template);
  c.footerLeft = model.footerLeft;
  c.footerRight = model.footerRight;

  c.banner("Rapport d'agence", model.title, model.subtitle, true);

  c.highlightCard({
    eyebrow: "L'agence est",
    value: model.overviewVerdict,
    tone: model.overviewTone,
    sentence: model.overviewSentence,
  });

  c.section("Les chiffres clés");
  c.kpiGrid(model.metrics);

  // ===== Les projets =====
  c.section("Les projets");

  const drawProjectHeader = (): number => {
    const h = c.y + 12;
    c.font("bold", 8.5).setText(TEXT_MUTED);
    c.write("PROJET", c.M, h);
    c.write("AVANCEMENT", 250, h);
    c.write("TÂCHES", 428, h);
    c.write("SITUATION", 490, h);
    return c.y + 21;
  };

  let rowTop = drawProjectHeader();
  if (model.projects.length === 0) {
    c.hlineAt(rowTop, BORDER, 0.4);
    c.font("normal", 10).setText(TEXT_MUTED);
    c.write("Aucun projet dans cette agence.", c.M, rowTop + 16);
    rowTop += 24;
  }

  model.projects.forEach((p) => {
    if (rowTop + 24 > c.BOTTOM) {
      c.addPage();
      rowTop = drawProjectHeader();
    }
    c.hlineAt(rowTop, BORDER, 0.4);
    const baseline = rowTop + 16;

    c.font("bold", 10).setText(TEXT_DARK);
    c.write(c.truncate(p.name, 250 - c.M - 8), c.M, baseline);

    c.setFill(BAR_TRACK).doc.rect(250, baseline - 10, 140, 10, "F");
    const fillW = Math.max(0, Math.min(140, (140 * p.pct) / 100));
    if (fillW > 0) {
      c.setFill(c.toneColor(p.tone)).doc.rect(250, baseline - 10, fillW, 10, "F");
    }
    c.font("bold", 10).setText(TEXT_DARK);
    c.write(`${p.pct} %`, 420, baseline, { align: "right" });

    c.font("normal", 9.2).setText(TEXT_DARK);
    c.write(`${p.done}/${p.total}`, 428, baseline);

    c.font("normal", 9.2).setText(p.overdue > 0 ? TONE_WARN : TEXT_DARK);
    c.write(p.overdue > 0 ? `${p.overdue} en retard` : "À jour", 490, baseline);

    rowTop += 24;
  });
  c.y = rowTop;

  // ===== L'équipe =====
  c.section("L'équipe");
  if (model.members.length === 0) {
    c.y += 4;
    c.font("normal", 10).setText(TEXT_MUTED);
    c.write("Aucune tâche assignée pour le moment.", c.M, c.y + 12);
    c.y += 26;
  } else {
    c.y += 3;
    model.members.forEach((row, idx) => {
      c.flowRow({ badge: row.badge, badgeTone: row.tone, lead: row.lead, rest: row.rest, index: idx });
    });
  }

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
    lines.forEach((line: string, i: number) => c.write(line, 88, baseline + i * 13));
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

export const agencyReportFileName = (agency: Agency): string =>
  `rapport-agence-${slugify(agency.name) || "agence"}.pdf`;

// ---------- API publique ----------
export async function buildAgencyReportPdf(
  agency: Agency,
  data: AgencyReportData,
  options: ReportOptions = {},
): Promise<jsPDF> {
  const model = buildModel({ agency, ...data });
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

export async function exportAgencyReportPdf(
  agency: Agency,
  data: AgencyReportData,
  options: ReportOptions = {},
): Promise<void> {
  const doc = await buildAgencyReportPdf(agency, data, options);
  doc.save(agencyReportFileName(agency));
}
