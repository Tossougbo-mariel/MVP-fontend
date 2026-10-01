// ============================================================
// Service de l'assistant IA.
// Le backend est la seule source de verite : sans cle configuree il
// repond 503, et l'UI affiche cet etat au lieu d'inventer des reponses.
// ============================================================
import { api } from "./api";

export type AiRole = "user" | "assistant";

export type AiTurn = {
  role: AiRole;
  content: string;
};

export type AiStatus = {
  configured: boolean;
  model: string | null;
  read_only: boolean;
};

export type AiReply = {
  reply: string;
  model: string;
  usage: Record<string, number>;
};

export const fetchAiStatus = async (): Promise<AiStatus> => {
  const { data } = await api.get<AiStatus>("/ai/status");
  return data;
};

export const sendAiMessage = async (params: {
  message: string;
  history: AiTurn[];
  agencyId?: string | null;
}): Promise<AiReply> => {
  const { data } = await api.post<AiReply>("/ai/chat", {
    message: params.message,
    history: params.history,
    agency_id: params.agencyId ? Number(params.agencyId) : null,
  });
  return data;
};
