import Fastify from "fastify";
import { initOpenRouterModels, chatOpenRouter } from "../../packages/shared/ai/openrouter.js";

const app = Fastify({ logger: true });

const PORT = Number(process.env.PORT ?? 8080);

app.get("/healthz", async () => ({ ok: true }));

app.get("/api/hello", async () => ({ message: "Hello from Node (Fastify)!" }));

app.post("/api/ai/reason", async (req, reply) => {
  // Minimal example: reasoning call
  try {
    await initOpenRouterModels(); // MUST call /models first per run
    const body = (req.body ?? {}) as { prompt?: string };
    const prompt = body.prompt ?? "用严谨逻辑解释为什么要先拉取模型列表再选择推理模型。";

    const out = await chatOpenRouter({
      mode: "reasoning",
      messages: [
        { role: "system", content: "你是严谨的推理助手。请给出清晰步骤与结论。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    });

    return { output: out };
  } catch (e: any) {
    req.log.error({ err: e }, "ai_reason_failed");
    reply.code(500);
    return { code: "AI_REASON_FAILED", message: e?.message ?? "unknown error" };
  }
});

app.listen({ port: PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`api-node listening on ${PORT}`))
  .catch((err) => { app.log.error(err); process.exit(1); });
