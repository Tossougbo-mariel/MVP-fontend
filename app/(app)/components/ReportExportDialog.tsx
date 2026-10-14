"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FileDown, Palette, LayoutTemplate, Check } from "lucide-react";
import {
  DEFAULT_COLOR,
  DEFAULT_TEMPLATE,
  PRESET_COLORS,
  REPORT_TEMPLATES,
  type ReportOptions,
  type ReportTemplateId,
} from "@/lib/reportTheme";

interface ReportExportDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  exporting?: boolean;
  onExport: (options: ReportOptions) => void | Promise<void>;
  onCancel: () => void;
}

/** Aperçu miniature du bandeau pour chaque gabarit. */
function TemplatePreview({ template, color }: { template: ReportTemplateId; color: string }) {
  return (
    <div
      className="relative w-full h-12 rounded-lg overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
    >
      {template === "classique" && (
        <>
          <div className="absolute inset-x-0 top-0 h-6" style={{ background: color }} />
          <div
            className="absolute right-0 top-0 h-6 w-8"
            style={{ background: "linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.18) 40%)" }}
          />
        </>
      )}
      {template === "moderne" && (
        <>
          <div className="absolute inset-x-0 top-0 h-7 rounded-t-lg" style={{ background: color }} />
          <div
            className="absolute right-1 top-1 w-5 h-5 rounded-full"
            style={{ background: "rgba(255,255,255,0.22)" }}
          />
        </>
      )}
      {template === "minimal" && (
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      )}
      <div className="absolute left-2 bottom-1.5 h-1 w-10 rounded-full" style={{ background: "var(--border-subtle)" }} />
      <div className="absolute left-2 bottom-3.5 h-1 w-16 rounded-full" style={{ background: "var(--border-subtle)" }} />
    </div>
  );
}

export default function ReportExportDialog({
  open,
  title,
  description,
  confirmLabel = "Exporter le PDF",
  exporting = false,
  onExport,
  onCancel,
}: ReportExportDialogProps) {
  const [template, setTemplate] = useState<ReportTemplateId>(DEFAULT_TEMPLATE);
  const [color, setColor] = useState<string>(DEFAULT_COLOR);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exporting) onCancel();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, exporting, onCancel]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
            onClick={exporting ? undefined : onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
              >
                <FileDown size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h3>
                {description && (
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Gabarit */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2">
                <LayoutTemplate size={14} style={{ color: "var(--text-secondary)" }} />
                <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  Modèle
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {REPORT_TEMPLATES.map((t) => {
                  const active = template === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className="text-left rounded-xl p-2 transition-all hover:-translate-y-0.5"
                      style={{
                        background: "var(--surface)",
                        border: `1.5px solid ${active ? "var(--accent-text)" : "var(--border-subtle)"}`,
                      }}
                    >
                      <TemplatePreview template={t.id} color={color} />
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>
                          {t.name}
                        </span>
                        {active && <Check size={12} style={{ color: "var(--accent-text)" }} />}
                      </div>
                      <p className="mt-0.5 text-[10.5px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                        {t.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Couleur */}
            <div className="mt-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Palette size={14} style={{ color: "var(--text-secondary)" }} />
                <span className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Couleur de base
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((preset) => {
                  const active = preset.hex.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      title={preset.name}
                      onClick={() => setColor(preset.hex)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                      style={{
                        background: preset.hex,
                        border: active ? "2px solid var(--text-primary)" : "2px solid transparent",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    >
                      {active && <Check size={14} className="text-white" />}
                    </button>
                  );
                })}
                <label
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                  title="Couleur personnalisée"
                  style={{ border: "1px dashed var(--border-subtle)", background: "var(--surface)" }}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 -m-1 cursor-pointer bg-transparent border-0 p-0"
                  />
                </label>
              </div>
            </div>

            {/* Aperçu du bandeau pleine largeur */}
            <div
              className="mt-4 rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: color }}
            >
              <div>
                <div className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>
                  {title}
                </div>
              </div>
              <FileDown size={16} style={{ color: "rgba(255,255,255,0.85)" }} />
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={exporting}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => onExport({ template, color })}
                disabled={exporting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all hover:scale-[1.02]"
                style={{ background: "var(--color-success)", boxShadow: "0 6px 16px -6px rgba(16,185,129,0.5)" }}
              >
                <FileDown size={15} /> {exporting ? "Export en cours…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
