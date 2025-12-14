import Fastify from "fastify";
import pg from "pg";

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/app";
const PORT = Number(process.env.PORT ?? 8080);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const APP_URL = process.env.APP_URL ?? "http://localhost:8080";
const APP_NAME = process.env.APP_NAME ?? "project-starter";
const OPENROUTER_REASONING_MODEL = process.env.OPENROUTER_REASONING_MODEL;
const OPENROUTER_DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL;

// Database pool
const pool = new pg.Pool({ connectionString: DATABASE_URL });

// Fastify instance
const app = Fastify({ logger: true });

// --- Database helpers ---
async function query<T extends pg.QueryResultRow>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

async function waitForDb(maxAttempts = 30, delayMs = 1000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("[db] Connected to PostgreSQL");
      return;
    } catch {
      console.log(`[db] Waiting for database... attempt ${i + 1}/${maxAttempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Failed to connect to database after max attempts");
}

// --- OpenRouter client ---
interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  supported_parameters?: string[];
}

let cachedModels: OpenRouterModel[] | null = null;

async function initOpenRouterModels(): Promise<OpenRouterModel[]> {
  if (cachedModels) return cachedModels;

  if (!OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");

  const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": APP_URL,
      "X-Title": APP_NAME,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`);
  }

  const payload = await res.json() as { data?: OpenRouterModel[] } | OpenRouterModel[];
  const arr = Array.isArray(payload) ? payload : (payload?.data ?? []);
  cachedModels = arr.filter((m): m is OpenRouterModel => m && typeof m.id === "string");
  return cachedModels;
}

function isReasoningModel(m: OpenRouterModel): boolean {
  if ((m.supported_parameters ?? []).includes("reasoning")) return true;
  const hay = `${m.id} ${m.name ?? ""}`.toLowerCase();
  return /(reasoning|thinking|\bo1\b|\br1\b)/i.test(hay);
}

function pickModel(mode: "reasoning" | "default"): { primary: string; fallbacks: string[] } {
  const models = cachedModels ?? [];
  const pinned = mode === "reasoning" ? OPENROUTER_REASONING_MODEL : OPENROUTER_DEFAULT_MODEL;

  if (pinned && models.some(m => m.id === pinned)) {
    const pool = models.filter(m => mode === "reasoning" ? isReasoningModel(m) : true).filter(m => m.id !== pinned);
    return { primary: pinned, fallbacks: pool.slice(0, 2).map(m => m.id) };
  }

  const pool = (mode === "reasoning" ? models.filter(isReasoningModel) : models).slice();
  const primary = pool[0]?.id ?? (mode === "reasoning" ? "openai/o1" : "openai/gpt-4o-mini");
  const fallbacks = pool.slice(1, 3).map(m => m.id);
  return { primary, fallbacks };
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function chatOpenRouter(opts: {
  mode?: "reasoning" | "default";
  messages: ChatMessage[];
  temperature?: number;
}): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");
  if (!cachedModels) await initOpenRouterModels();

  const mode = opts.mode ?? "default";
  const { primary, fallbacks } = pickModel(mode);

  const body: Record<string, unknown> = {
    model: primary,
    models: [primary, ...fallbacks],
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
  };

  if (mode === "reasoning") {
    body.reasoning = { effort: "high" };
  }

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": APP_URL,
      "X-Title": APP_NAME,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenRouter error: ${res.status} ${txt}`);
  }

  const resp = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = resp?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Missing choices[0].message.content");
  return content;
}

// --- Unified error response format ---
interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

function errorResponse(code: string, message: string, details?: unknown): ApiError {
  return { code, message, ...(details ? { details } : {}) };
}

// --- Routes ---

// Health check
app.get("/healthz", async () => {
  try {
    await pool.query("SELECT 1");
    return { ok: true, ts: new Date().toISOString() };
  } catch {
    return { ok: false, ts: new Date().toISOString() };
  }
});

// Hello endpoint
app.get("/hello", async () => ({ message: "hello", backend: "node" }));

// --- Admin Users Routes ---
interface User {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

// GET /admin/users - List users (React-Admin compatible)
app.get("/admin/users", async (req, reply) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Parse React-Admin pagination params
    const rangeParam = url.searchParams.get("range");
    let offset = 0;
    let limit = 25;

    if (rangeParam) {
      try {
        const [start, end] = JSON.parse(rangeParam);
        offset = start;
        limit = end - start + 1;
      } catch {
        // Use defaults
      }
    }

    // Parse sorting
    const sortParam = url.searchParams.get("sort");
    let orderBy = "created_at";
    let orderDir = "DESC";

    if (sortParam) {
      try {
        const [field, dir] = JSON.parse(sortParam);
        const allowedFields = ["id", "name", "email", "created_at", "updated_at"];
        if (allowedFields.includes(field)) {
          orderBy = field;
          orderDir = dir === "ASC" ? "ASC" : "DESC";
        }
      } catch {
        // Use defaults
      }
    }

    const countResult = await query<{ count: string }>("SELECT COUNT(*) as count FROM users");
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query<User>(
      `SELECT id, name, email, created_at, updated_at FROM users ORDER BY ${orderBy} ${orderDir} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Set Content-Range header for React-Admin
    reply.header("Content-Range", `users ${offset}-${offset + dataResult.rows.length - 1}/${total}`);
    reply.header("Access-Control-Expose-Headers", "Content-Range");

    return { data: dataResult.rows, total };
  } catch (err) {
    app.log.error({ err }, "Failed to list users");
    reply.code(500);
    return errorResponse("DB_ERROR", "Failed to fetch users");
  }
});

// GET /admin/users/:id - Get single user
app.get<{ Params: { id: string } }>("/admin/users/:id", async (req, reply) => {
  try {
    const { id } = req.params;
    const result = await query<User>(
      "SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      reply.code(404);
      return errorResponse("NOT_FOUND", `User ${id} not found`);
    }

    return { data: result.rows[0] };
  } catch (err) {
    app.log.error({ err }, "Failed to get user");
    reply.code(500);
    return errorResponse("DB_ERROR", "Failed to fetch user");
  }
});

// --- OpenRouter AI Reasoning ---
app.post<{ Body: { prompt?: string } }>("/ai/reason", async (req, reply) => {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "your_openrouter_key") {
    reply.code(400);
    return errorResponse(
      "MISSING_API_KEY",
      "OPENROUTER_API_KEY is not configured. Please set it in your .env file.",
      { hint: "Get your API key from https://openrouter.ai/keys" }
    );
  }

  try {
    await initOpenRouterModels();
    const prompt = req.body?.prompt ?? "Explain why we must fetch /models before picking a reasoning model.";

    const output = await chatOpenRouter({
      mode: "reasoning",
      messages: [
        { role: "system", content: "You are a rigorous reasoning assistant. Provide clear steps and conclusions." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    });

    return { output, model: "reasoning" };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    app.log.error({ err }, "ai_reason_failed");
    reply.code(500);
    return errorResponse("AI_REASON_FAILED", errMsg);
  }
});

// --- Startup ---
async function start() {
  try {
    await waitForDb();
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`api-node listening on ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
