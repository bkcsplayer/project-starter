import Fastify from "fastify";
import { initOpenRouterModels, chatOpenRouter } from "../../packages/shared/ai/openrouter.js";

const PORT = Number(process.env.PORT ?? 3001);

const app = Fastify({ logger: true });

app.get("/healthz", async () => ({ ok: true }));

// Example endpoint (optional): POST /ai/reason
app.post("/ai/reason", async (req, reply) => {
  const body = (req.body ?? {}) as any;
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  if (!prompt) return reply.code(400).send({ code: "BAD_REQUEST", message: "prompt is required" });

  const { content, modelUsed, fallbacks } = await chatOpenRouter({
    mode: "reasoning",
    messages: [
      { role: "system", content: "你是严谨的推理助手，给出清晰步骤与结论。" },
      { role: "user", content: prompt },
    ],
  });

  return { modelUsed, fallbacks, content };
});

async function main() {
  // Mandatory: fetch /models on startup
  await initOpenRouterModels();
  app.log.info({ msg: "OpenRouter models loaded" });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info({ msg: "API listening", port: PORT });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
