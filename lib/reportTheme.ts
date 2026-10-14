// ============================================================
// Socle commun des rapports PDF (projet et agence).
//
// Regroupe :
//  - la palette dérivée d'une couleur de base choisie par l'utilisateur ;
//  - les gabarits (« modèles ») de mise en page ;
//  - une petite classe `ReportCanvas` qui encapsule jsPDF et fournit
//    des primitives de rendu (bandeau, titres de section, pastilles,
//    tuiles d'indicateurs, pied de page) déclinées selon le gabarit.
//
// Les générateurs de rapport (projectReportPdf, agencyReportPdf) ne
// s'occupent que des données et de leur disposition ; l'habillage est ici.
// ============================================================
import type { jsPDF } from "jspdf";

export type RGB = [number, number, number];
export type Tone = "good" | "info" | "warn" | "bad";
export type ReportTemplateId = "classique" | "moderne" | "minimal";

/** Options communes aux générateurs de rapport (gabarit + couleur de base). */
export type ReportOptions = {
  template?: ReportTemplateId;
  color?: string;
};

export type ReportPalette = {
  base: RGB;
  baseDark: RGB;
  tint: RGB;
  onBase: RGB;
  onBaseMuted: RGB;
};

// ---------- Couleurs neutres & sémantiques ----------
export const WHITE: RGB = [255, 255, 255];
export const TEXT_DARK: RGB = [38, 48, 59];
export const TEXT_MUTED: RGB = [95, 107, 122];
export const BORDER: RGB = [217, 222, 228];
export const TILE_BG: RGB = [246, 248, 251];
export const BAR_TRACK: RGB = [230, 234, 239];
export const TONE_GOOD: RGB = [46, 125, 79];
export const TONE_WARN: RGB = [201, 138, 11];
export const TONE_BAD: RGB = [192, 57, 43];

export const DEFAULT_COLOR = "#12263f";
export const DEFAULT_TEMPLATE: ReportTemplateId = "classique";

export const REPORT_TEMPLATES: { id: ReportTemplateId; name: string; description: string }[] = [
  { id: "classique", name: "Classique", description: "Bandeau à rayons, encart de synthèse coloré et tuiles." },
  { id: "moderne", name: "Moderne", description: "Bandeau plein, cartes arrondies et accents latéraux." },
  { id: "minimal", name: "Minimal", description: "Épuré : filets fins, titres sobres, beaucoup de blanc." },
];

export const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: "Marine", hex: "#12263f" },
  { name: "Indigo", hex: "#33379e" },
  { name: "Émeraude", hex: "#137a5a" },
  { name: "Turquoise", hex: "#0f766e" },
  { name: "Violet", hex: "#6d28d9" },
  { name: "Bordeaux", hex: "#9b2c3a" },
  { name: "Terracotta", hex: "#c05621" },
  { name: "Ardoise", hex: "#334155" },
];

// ---------- Utilitaires couleur ----------
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export const hexToRgb = (hex: string): RGB => {
  const h = (hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hexToRgb(DEFAULT_COLOR);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgbToHex = (rgb: RGB): string =>
  `#${rgb.map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;

export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [
  clamp(a[0] + (b[0] - a[0]) * t),
  clamp(a[1] + (b[1] - a[1]) * t),
  clamp(a[2] + (b[2] - a[2]) * t),
];

const luminance = (c: RGB): number => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;

/** Construit la palette d'un rapport à partir de sa couleur de base. */
export const buildPalette = (base: RGB): ReportPalette => {
  const onBase: RGB = luminance(base) > 0.62 ? [26, 32, 44] : WHITE;
  return {
    base,
    baseDark: mixRgb(base, [0, 0, 0], 0.3),
    tint: mixRgb(base, WHITE, 0.9),
    onBase,
    onBaseMuted: mixRgb(onBase, base, 0.4),
  };
};

export const paletteFromHex = (hex: string): ReportPalette => buildPalette(hexToRgb(hex));

// ============================================================
// ReportCanvas
// ============================================================
export class ReportCanvas {
  readonly doc: jsPDF;
  readonly palette: ReportPalette;
  readonly template: ReportTemplateId;
  readonly M = 57;
  readonly RIGHT = 539;
  readonly PAGE_W = 595.28;
  readonly BOTTOM = 782;
  y = 0;
  footerLeft = "";
  footerRight = "";
  private headKicker = "";
  private headTitle = "";
  private headSubtitle = "";

  constructor(doc: jsPDF, palette: ReportPalette, template: ReportTemplateId = DEFAULT_TEMPLATE) {
    this.doc = doc;
    this.palette = palette;
    this.template = template;
  }

  // ---------- Primitives ----------
  setFill(c: RGB) {
    this.doc.setFillColor(c[0], c[1], c[2]);
    return this;
  }
  setDraw(c: RGB) {
    this.doc.setDrawColor(c[0], c[1], c[2]);
    return this;
  }
  setText(c: RGB) {
    this.doc.setTextColor(c[0], c[1], c[2]);
    return this;
  }
  font(style: "normal" | "bold", size: number) {
    this.doc.setFont("helvetica", style);
    this.doc.setFontSize(size);
    return this;
  }
  measure(s: string): number {
    return this.doc.getTextWidth(s);
  }
  write(s: string, x: number, yy: number, opts?: { align?: "left" | "center" | "right" }) {
    this.doc.text(String(s), x, yy, opts);
  }
  split(text: string, w: number): string[] {
    return this.doc.splitTextToSize(text, w) as string[];
  }
  toneColor(tone: Tone): RGB {
    if (tone === "good") return TONE_GOOD;
    if (tone === "warn") return TONE_WARN;
    if (tone === "bad") return TONE_BAD;
    return this.palette.baseDark;
  }
  truncate(s: string, maxWidth: number): string {
    if (this.measure(s) <= maxWidth) return s;
    let out = s;
    while (out.length > 1 && this.measure(`${out}…`) > maxWidth) out = out.slice(0, -1);
    return `${out.trimEnd()}…`;
  }
  // ---------- Pagination ----------
  ensureSpace(needed: number) {
    if (this.y + needed > this.BOTTOM) this.addPage();
  }
  addPage() {
    this.doc.addPage();
    this.drawHeader(false);
  }

  // ---------- Bandeau / en-tête ----------
  /** Dessine le bandeau d'en-tête. `first` = première page (titre complet). */
  banner(kicker: string, title: string, subtitle: string, first: boolean) {
    if (first) {
      this.headKicker = kicker;
      this.headTitle = title;
      this.headSubtitle = subtitle;
    }
    if (this.template === "minimal") {
      this.setFill(this.palette.base).doc.rect(0, 0, this.PAGE_W, 6, "F");
      this.font("bold", 7.5).setText(TEXT_MUTED);
      this.write(kicker.toUpperCase(), this.M, 30);
      this.font("bold", first ? 20 : 12).setText(this.palette.baseDark);
      this.write(first ? title : this.truncate(title, this.RIGHT - this.M), this.M, first ? 56 : 49);
      if (first && subtitle) {
        this.font("normal", 9.5).setText(TEXT_MUTED);
        this.write(subtitle, this.M, 72);
      }
      this.hlineAt(first ? 84 : 62, BORDER, 0.6);
      this.y = first ? 100 : 78;
      return;
    }

    const H = this.template === "classique" ? 88 : 92;
    this.setFill(this.palette.base).doc.rect(0, 0, this.PAGE_W, H, "F");

    if (this.template === "classique") {
      this.setDraw(this.palette.baseDark);
      this.doc.setLineWidth(0.6);
      const rayX = [397, 417, 437, 456, 476, 496];
      const rayY = [198, 179, 159, 139, 119, 99];
      rayX.forEach((x, i) => this.doc.line(x, 0, this.PAGE_W, rayY[i]));
    } else {
      this.setFill(this.palette.onBaseMuted).doc.circle(this.PAGE_W - 44, 74, 14, "F");
      this.setFill(this.palette.baseDark).doc.circle(this.PAGE_W - 58, 26, 40, "F");
    }

    this.setDraw(this.template === "classique" ? TONE_WARN : this.palette.onBaseMuted);
    this.doc.setLineWidth(2);
    this.doc.line(this.M, 28, this.M + 51, 28);

    this.font("bold", 7.5).setText(this.palette.onBaseMuted);
    this.write(kicker.toUpperCase(), this.M, 21);

    if (first) {
      this.font("bold", 21).setText(this.palette.onBase);
      let size = 21;
      while (size > 12 && this.measure(title) > this.RIGHT - this.M) {
        size -= 0.5;
        this.doc.setFontSize(size);
      }
      this.write(title, this.M, 56);
      if (subtitle) {
        this.font("normal", 10).setText(this.palette.onBaseMuted);
        this.write(subtitle, this.M, 74);
      }
    } else {
      this.font("bold", 11).setText(this.palette.onBase);
      this.write(this.truncate(title, this.RIGHT - this.M), this.M, 52);
    }
    this.y = first ? H + 14 : H - 12;
  }

  private drawHeader(first: boolean) {
    this.banner(this.headKicker, this.headTitle, this.headSubtitle, first);
  }

  hlineAt(y: number, color: RGB = BORDER, width = 0.4) {
    this.setDraw(color);
    this.doc.setLineWidth(width);
    this.doc.line(this.M, y, this.RIGHT, y);
  }

  // ---------- Titre de section ----------
  section(text: string) {
    this.ensureSpace(64);
    this.y += 18;
    if (this.template === "classique") {
      this.font("bold", 12.5).setText(this.palette.baseDark);
      this.write(text, this.M, this.y);
      this.hlineAt(this.y + 6, this.palette.base, 0.9);
      this.y += 6;
    } else if (this.template === "moderne") {
      this.font("bold", 12);
      const w = this.measure(text) + 24;
      this.setFill(this.palette.tint);
      this.doc.roundedRect(this.M - 6, this.y - 11, w, 18, 4, 4, "F");
      this.setFill(this.palette.base);
      this.doc.rect(this.M - 6, this.y - 11, 3, 18, "F");
      this.setText(this.palette.baseDark);
      this.write(text, this.M + 5, this.y);
      this.y += 8;
    } else {
      this.font("bold", 10.5).setText(this.palette.baseDark);
      this.write(text.toUpperCase(), this.M, this.y);
      this.hlineAt(this.y + 5, BORDER, 0.6);
      this.y += 5;
    }
  }

  // ---------- Encart de synthèse ----------
  highlightCard(opts: { eyebrow: string; value: string; tone: Tone; sentence: string }) {
    const { eyebrow, value, tone, sentence } = opts;
    const h = 72;
    this.ensureSpace(h + 16);
    const tpl = this.template;
    if (tpl === "classique") {
      this.setFill(this.palette.tint).doc.rect(this.M, this.y, this.RIGHT - this.M, h, "F");
      this.setFill(this.toneColor(tone)).doc.rect(this.M, this.y, 4, h, "F");
    } else if (tpl === "moderne") {
      this.setFill(WHITE).setDraw(BORDER);
      this.doc.setLineWidth(0.8);
      this.doc.roundedRect(this.M, this.y, this.RIGHT - this.M, h, 8, 8, "FD");
      this.setFill(this.toneColor(tone)).doc.rect(this.M, this.y + 8, 5, h - 16, "F");
    } else {
      this.hlineAt(this.y, BORDER, 0.6);
      this.hlineAt(this.y + h, BORDER, 0.6);
    }

    this.font("bold", 8).setText(this.palette.baseDark);
    this.write(eyebrow.toUpperCase(), this.M + 16, this.y + 18);

    this.font("bold", 19).setText(this.toneColor(tone));
    this.write(value, this.M + 16, this.y + 40);

    this.font("normal", 10).setText(TEXT_DARK);
    this.split(sentence, this.RIGHT - this.M - 32)
      .slice(0, 2)
      .forEach((line, i) => this.write(line, this.M + 16, this.y + 55 + i * 13));

    this.y += h + 6;
  }

  // ---------- Tuiles d'indicateurs ----------
  kpiGrid(items: { value: string; label: string; tone: Tone }[]) {
    const cols = 3;
    const gap = 12;
    const tileW = (this.RIGHT - this.M - gap * (cols - 1)) / cols;
    const tileH = 54;
    const rows = Math.ceil(items.length / cols);
    const gridH = rows * tileH + (rows - 1) * gap;
    this.ensureSpace(gridH + 24);
    const top0 = this.y + 10;
    items.forEach((it, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = this.M + col * (tileW + gap);
      const top = top0 + row * (tileH + gap);
      this.kpiTile(x, top, tileW, tileH, it.value, it.label, it.tone);
    });
    this.y = top0 + gridH;
  }

  private kpiTile(x: number, top: number, w: number, h: number, value: string, label: string, tone: Tone) {
    const tpl = this.template;
    const tc = this.toneColor(tone);
    if (tpl === "classique") {
      this.setFill(TILE_BG).doc.roundedRect(x, top, w, h, 6, 6, "F");
      this.setFill(tc).doc.rect(x + 7, top, w - 14, 3, "F");
    } else if (tpl === "moderne") {
      this.setFill(WHITE).setDraw(BORDER);
      this.doc.setLineWidth(0.6);
      this.doc.roundedRect(x, top, w, h, 6, 6, "FD");
      this.setFill(tc).doc.rect(x + 8, top + 9, 3, h - 18, "F");
    } else {
      this.hlineAt(top, BORDER, 0.5);
      this.setFill(tc).doc.rect(x, top + h - 3, w, 2, "F");
    }
    this.font("bold", 20).setText(tc);
    this.write(value, x + 14, top + 30);
    this.font("normal", 8.4).setText(TEXT_MUTED);
    this.split(label, w - 26)
      .slice(0, 2)
      .forEach((line, i) => this.write(line, x + 14, top + 44 + i * 10));
  }

  // ---------- Pastille d'état ----------
  badge(x: number, baseline: number, label: string, tone: Tone) {
    const tc = this.toneColor(tone);
    if (this.template === "minimal") {
      this.font("bold", 8);
      const w = Math.max(52, this.measure(label) + 14);
      this.setDraw(tc);
      this.doc.setLineWidth(0.8);
      this.doc.roundedRect(x, baseline - 11, w, 15, 7.5, 7.5, "D");
      this.setText(tc);
      this.write(label, x + w / 2, baseline - 0.5, { align: "center" });
      return;
    }
    this.font("bold", 8.5);
    const w = Math.max(60, this.measure(label) + 16);
    this.setFill(tc);
    this.doc.roundedRect(x, baseline - 12.5, w, 17, 2.5, 2.5, "F");
    this.setText(WHITE);
    this.write(label, x + w / 2, baseline - 0.5, { align: "center" });
  }

  // ---------- Texte en flux (titre gras + suite enroulée) ----------
  flowLineCount(x: number, maxRight: number, lead: string, rest: string): number {
    this.font("bold", 10);
    const leadW = this.measure(lead);
    this.font("normal", 10);
    const space = this.measure(" ");
    let cx = x + leadW;
    let lines = 1;
    rest
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => {
        const ww = this.measure(w);
        if (cx > x && cx + ww > maxRight) {
          lines += 1;
          cx = x;
        }
        cx += ww + space;
      });
    return lines;
  }

  drawFlow(x: number, baseline: number, maxRight: number, lead: string, rest: string) {
    this.font("bold", 10).setText(TEXT_DARK);
    this.write(lead, x, baseline);
    let cx = x + this.measure(lead);
    const space = this.measure(" ");
    this.font("normal", 10);
    let ly = baseline;
    rest
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => {
        const ww = this.measure(w);
        if (cx > x && cx + ww > maxRight) {
          ly += 13;
          cx = x;
        }
        this.write(w, cx, ly);
        cx += ww + space;
      });
  }

  /** Ligne de liste : pastille + texte en flux, avec filet de séparation. */
  flowRow(opts: { badge?: string; badgeTone?: Tone; lead: string; rest: string; index: number }) {
    const { badge, badgeTone = "info", lead, rest, index } = opts;
    const x = badge != null ? 142 : 60;
    const lines = this.flowLineCount(x, this.RIGHT, lead, rest);
    const rowH = 16 + (lines - 1) * 13 + 12;
    this.ensureSpace(rowH);
    if (index > 0) this.hlineAt(this.y, BORDER, 0.4);
    const baseline = this.y + 16;
    if (badge != null) this.badge(60, baseline, badge, badgeTone);
    this.drawFlow(x, baseline, this.RIGHT, lead, rest);
    this.y += rowH;
  }

  // ---------- Pied de page ----------
  finish() {
    const total = this.doc.getNumberOfPages();
    for (let p = 1; p <= total; p += 1) {
      this.doc.setPage(p);
      this.hlineAt(801, BORDER, 0.6);
      this.font("normal", 7).setText(TEXT_MUTED);
      this.write(this.footerLeft, this.M, 811);
      this.write(this.footerRight, this.RIGHT, 811, { align: "right" });
    }
  }
}
