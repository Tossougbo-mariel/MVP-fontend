"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot, X, Send, Sparkles, Loader2, Trash2, AlertTriangle, WifiOff,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  fetchAiStatus, sendAiMessage, type AiStatus, type AiTurn,
} from "@/lib/ai";
import { getApiErrorMessage } from "@/lib/api";

type Message = AiTurn & { id: string };

const SUGGESTION_KEYS = [
  "suggestionStart",
  "suggestionLate",
  "suggestionSummary",
] as const;

let counter = 0;
const nextId = () => `m${++counter}`;

const bubbleStyle = (mine: boolean) => ({
  background: mine ? "var(--gradient-button)" : "var(--card-bg)",
  color: mine ? "#FFFFFF" : "var(--text-primary)",
  border: mine ? "none" : "1px solid var(--border-subtle)",
});

/**
 * Panneau de l'assistant IA. Il est volontairement en lecture seule :
 * l'agent explique et propose, il n'ecrit jamais en base.
 */
export default function AiAgentPanel({
  open,
  onClose,
  onOpen,
  agencyId,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  agencyId: string | null;
}) {
  const t = useTranslations("Ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchAiStatus()
      .then(setStatus)
      .catch(() => {
        // Backend injoignable ou erreur passagere : on ne retombe pas sur
        // "Non configure" (ce qui verrouillerait le panneau a tort). On garde
        // un etat inconnu et on laisse l'envoi tenter sa chance : l'erreur
        // reelle s'affichera dans la zone dediee si l'envoi echoue.
        setStatus(null);
        setError(t("statusError"));
      });
  }, [open, t]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;

      setError(null);
      setInput("");
      setPending(true);

      // Le backend valide `history` a 20 entrees maximum ; seul le panel garde
      // la conversation, on lui renvoie donc seulement la fin de l'echange
      // (les 18 derniers messages = 9 tours) pour ne jamais provoquer de 422.
      const history: AiTurn[] = messages.slice(-18).map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [...prev, { id: nextId(), role: "user", content: trimmed }]);

      try {
        const { reply } = await sendAiMessage({ message: trimmed, history, agencyId });
        setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content: reply }]);
        setStatus((prev) => (prev ? { ...prev, configured: true } : prev));
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setPending(false);
      }
    },
    [messages, pending, agencyId],
  );

  const notConfigured = status !== null && !status.configured;

  return (
    <>
      {/* Bouton flottant, en bas a droite de la plateforme. Masque quand le
          panneau est ouvert : celui-ci a deja son bouton de fermeture. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={onOpen}
            aria-label={t("open")}
            title={t("title")}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.08 }}
            className="fixed bottom-5 right-5 z-40 w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Bot className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed z-40 bottom-5 right-5 w-[calc(100vw-2.5rem)] sm:w-[400px] max-h-[min(640px,calc(100vh-2.5rem))] rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 30px 70px -20px rgba(0,0,0,0.55)",
            }}
          >
            <header
              className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
              style={{
                background: "var(--gradient-primary)",
                borderColor: "rgba(255,255,255,0.2)",
              }}
            >
              <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{t("title")}</p>
                <p className="text-[11px] text-white/75 truncate">
                  {status === null
                    ? t("connecting")
                    : notConfigured
                      ? t("notConfigured")
                      : t("readOnly", { model: status.model ?? t("modelFallback") })}
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  aria-label={t("clear")}
                  className="p-2 rounded-lg text-white/80 hover:bg-white/15 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                onClick={onClose}
                aria-label={t("close")}
                className="p-2 rounded-lg text-white/80 hover:bg-white/15 transition-colors"
              >
                <X size={17} />
              </button>
            </header>

            {notConfigured && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 border-b text-xs"
                style={{
                  background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <AlertTriangle size={15} className="shrink-0 mt-px" style={{ color: "var(--color-error)" }} />
                <span>
                  {t.rich("notConfiguredWarning", {
                    code: (chunks) => <code className="font-semibold">{chunks}</code>,
                  })}
                </span>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="py-6 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    <Bot size={26} style={{ color: "var(--accent-text)" }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {t("emptyTitle")}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {t("emptyText")}
                  </p>

                  <div className="mt-4 flex flex-col gap-2">
                    {SUGGESTION_KEYS.map((key) => {
                      const suggestion = t(key);
                      return (
                        <button
                          key={key}
                          onClick={() => send(suggestion)}
                          className="px-3 py-2 rounded-xl text-xs text-left transition-colors"
                          style={{
                            background: "var(--hover-soft)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {suggestion}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className="flex">
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.role === "user" ? "ml-auto" : "mr-auto"
                    }`}
                    style={bubbleStyle(m.role === "user")}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {pending && (
                <div className="flex">
                  <div
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs"
                    style={{ background: "var(--hover-soft)", color: "var(--text-muted)" }}
                  >
                    <Loader2 size={13} className="animate-spin" />
                    {t("analyzing")}
                  </div>
                </div>
              )}

              {error && !notConfigured && (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
                  style={{
                    background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <WifiOff size={14} className="shrink-0 mt-px" style={{ color: "var(--color-error)" }} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2 px-3 py-3 border-t shrink-0"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder={notConfigured ? t("placeholderNotConfigured") : t("placeholder")}
                className="flex-1 resize-none px-3 py-2.5 rounded-xl text-sm outline-none max-h-28"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={pending || !input.trim() || notConfigured}
                aria-label={t("send")}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
                style={{ background: "var(--gradient-primary)" }}
              >
                {pending ? (
                  <Loader2 size={17} className="text-white animate-spin" />
                ) : (
                  <Send size={17} className="text-white" />
                )}
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
