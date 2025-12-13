# openrouter-node
Add OpenRouter model-fetch + reasoning-model selection wrapper for Node/TS.

Requirements:
- Create packages/shared/ai/openrouter.ts if missing
- Must fetch GET /models on process start and cache
- Must pick reasoning model for reasoning tasks (supported_parameters includes "reasoning" preferred)
- Must send reasoning: { effort: "high" } when mode=reasoning
- Should support fallbacks via request body models: [primary, fallback1, fallback2]
- Add a short usage example in services/api/src/server.ts (startup calls init)
