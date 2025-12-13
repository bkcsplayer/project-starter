# openrouter-python
Add OpenRouter wrapper for Python.

Requirements:
- Create packages/shared/ai/openrouter_client.py if missing (template style)
- Must fetch GET /models at startup and cache in memory
- Must pick reasoning model for reasoning tasks (supported_parameters includes "reasoning" preferred)
- Must send reasoning: { effort: "high" } when mode=reasoning
- Should support fallbacks via request body models: [primary, fallback1, fallback2]
- Add a short usage snippet in README.md
