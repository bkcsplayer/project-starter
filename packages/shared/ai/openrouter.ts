/**
 * OpenRouter client (Node/TS)
 * - MUST call GET /models on startup (initOpenRouterModels)
 * - Reasoning tasks use reasoning: { effort: "high" }
 */
export type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  supported_parameters?: string[];
};

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const APP_URL = process.env.APP_URL ?? "http://localhost";
const APP_NAME = process.env.APP_NAME ?? "project-starter";

const PIN_REASONING_MODEL = process.env.OPENROUTER_REASONING_MODEL;
const PIN_DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL;

let cachedModels: OpenRouterModel[] | null = null;

function mustKey() {
  if (!API_KEY) throw new Error("Missing OPENROUTER_API_KEY");
}

async function httpJson<T>(method: string, path: string, body?: any): Promise<T> {
  mustKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": APP_URL,
      "X-Title": APP_NAME,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${path} failed: ${res.status} ${res.statusText} ${txt}`.trim());
  }
  return (await res.json()) as T;
}

export async function initOpenRouterModels(): Promise<OpenRouterModel[]> {
  if (cachedModels) return cachedModels;
  const payload: any = await httpJson("GET", "/models");
  const arr = Array.isArray(payload) ? payload : (payload?.data ?? []);
  cachedModels = arr.filter((m: any) => m && typeof m.id === "string");
  return cachedModels!;
}

function isReasoningModel(m: OpenRouterModel): boolean {
  if ((m.supported_parameters ?? []).includes("reasoning")) return true;
  const hay = `${m.id} ${m.name ?? ""}`.toLowerCase();
  return /(reasoning|thinking|\bo1\b|\br1\b)/i.test(hay);
}

function pickModel(mode: "reasoning" | "default"): { primary: string; fallbacks: string[] } {
  const models = cachedModels ?? [];
  const pinned = mode === "reasoning" ? PIN_REASONING_MODEL : PIN_DEFAULT_MODEL;
  if (pinned && models.some(m => m.id === pinned)) {
    const pool = models.filter(m => mode === "reasoning" ? isReasoningModel(m) : true).filter(m => m.id !== pinned);
    return { primary: pinned, fallbacks: pool.slice(0,2).map(m => m.id) };
  }
  const pool = (mode === "reasoning" ? models.filter(isReasoningModel) : models).slice();
  const primary = pool[0]?.id ?? (mode === "reasoning" ? "openai/o1" : "openai/gpt-4o-mini");
  const fallbacks = pool.slice(1,3).map(m => m.id);
  return { primary, fallbacks };
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatOpenRouter(opts: {
  mode?: "reasoning" | "default";
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}): Promise<string> {
  mustKey();
  if (!cachedModels) await initOpenRouterModels();

  const mode = opts.mode ?? "default";
  const { primary, fallbacks } = pickModel(mode);

  const body: any = {
    model: primary,
    models: [primary, ...fallbacks],
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.max_tokens != null) body.max_tokens = opts.max_tokens;
  if (mode === "reasoning") body.reasoning = { effort: "high" };

  const resp: any = await httpJson("POST", "/chat/completions", body);
  const content = resp?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Missing choices[0].message.content");
  return content;
}
