---
description: How to use the OpenRouter TypeScript client for Node.js
---

# OpenRouter Node/TypeScript Usage

## Location
`/packages/shared/ai/openrouter.ts`

## ⚠️ Mandatory: Initialize Before Use
```typescript
import { initOpenRouterModels, chatOpenRouter } from '../../../packages/shared/ai/openrouter.js';

// MUST call this first - fetches and caches /models
await initOpenRouterModels();
```

## Basic Chat
```typescript
const response = await chatOpenRouter({
  mode: 'default',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7
});
console.log(response); // string content
```

## Reasoning Mode
```typescript
const response = await chatOpenRouter({
  mode: 'reasoning',  // Automatically uses reasoning models + effort:high
  messages: [
    { role: 'system', content: 'You are a rigorous reasoning assistant.' },
    { role: 'user', content: 'Explain step by step...' }
  ],
  temperature: 0.2
});
```

## Environment Variables
Required:
- `OPENROUTER_API_KEY` - Your API key from openrouter.ai

Optional:
- `OPENROUTER_BASE_URL` - Default: https://openrouter.ai/api/v1
- `OPENROUTER_REASONING_MODEL` - Pin specific reasoning model
- `OPENROUTER_DEFAULT_MODEL` - Pin specific default model
- `APP_URL` - For HTTP-Referer header
- `APP_NAME` - For X-Title header

## How It Works
1. `initOpenRouterModels()` calls `GET /models` and caches list
2. When `mode: 'reasoning'`, it filters for models supporting reasoning
3. Automatically adds `reasoning: { effort: "high" }` to request
4. Provides fallback models for resilience
