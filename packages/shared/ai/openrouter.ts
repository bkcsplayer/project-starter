// packages/shared/ai/openrouter.ts
// OpenRouter wrapper: fetch /models on startup, pick reasoning model, and send chat completions.

export type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  supported_parameters?: string[];
  pricing?: { prompt?: string; completion?: string };
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const APP_URL = process.env.APP_URL ?? "http://localhost";
const APP_NAME = process.env.APP_NAME ?? "cursor-prototype";

const PIN_REASONING_MODEL = process.env.OPENROUTER_REASONING_MODEL;
const PIN_DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL;

let cachedModels: OpenRouterModel[] | null = null;

function mustKey() {
  if (!API_KEY) throw new Error("Missing OPENROUTER_API_KEY");
}

function normalizeModels(payload: any): OpenRouterModel[] {
  const arr = Array.isArray(payload) ? payload : (payload?.data ?? []);
  return (arr as any[]).filter((m) => m && typeof m.id === "string");
}

export async function initOpenRouterModels(): Promise<OpenRouterModel[]> {
  if (cachedModels) return cachedModels;
  mustKey();

  const res = await fetch(`${BASE_URL}/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": APP_URL,
      "X-Title": APP_NAME,
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenRouter /models failed: ${res.status} ${res.statusText} ${txt}`.trim());
  }

  cachedModels = normalizeModels(await res.json());
  return cachedModels;
}

function isReasoningModel(m: OpenRouterModel): boolean {
  const sp = m.supported_parameters ?? [];
  if (sp.includes("reasoning")) return true;
  const hay = `${m.id} ${m.name ?? ""}`.toLowerCase();
  return /(reasoning|thinking|\bo1\b|\br1\b)/i.test(hay);
}

function pickModel(models: OpenRouterModel[], mode: "reasoning" | "default") {
  const pinned = mode === "reasoning" ? PIN_REASONING_MODEL : PIN_DEFAULT_MODEL;
  if (pinned && models.some((m) => m.id === pinned)) {
    const pool = (mode === "reasoning" ? models.filter(isReasoningModel) : models)
      .filter((m) => m.id !== pinned)
      .slice(0, 2)
      .map((m) => m.id);
    return { primary: pinned, fallbacks: pool };
  }

  const pool = mode === "reasoning" ? models.filter(isReasoningModel) : models;
  const primary = pool[0]?.id ?? (mode === "reasoning" ? "openai/o1" : "openai/gpt-4o-mini");
  const fallbacks = pool.filter((m) => m.id !== primary).slice(0, 2).map((m) => m.id);
  return { primary, fallbacks };
}

export async function chatOpenRouter(opts: {
  mode?: "reasoning" | "default";
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}): Promise<{ content: string; modelUsed: string; fallbacks: string[] }> {
  mustKey();
  const models = cachedModels ?? (await initOpenRouterModels());
  const mode = opts.mode ?? "default";
  const { primary, fallbacks } = pickModel(models, mode);

  const body: any = {
    model: primary,
    models: [primary, ...fallbacks],
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.max_tokens != null) body.max_tokens = opts.max_tokens;
  if (mode === "reasoning") body.reasoning = { effort: "high" };

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": APP_URL,
      "X-Title": APP_NAME,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenRouter chat failed: ${res.status} ${res.statusText} ${txt}`.trim());
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter response missing choices[0].message.content");
  }

  return { content, modelUsed: primary, fallbacks };
}
