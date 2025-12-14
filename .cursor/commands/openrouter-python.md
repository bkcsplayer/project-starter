---
description: How to use the OpenRouter Python client
---

# OpenRouter Python Usage

## Location
`/packages/shared/ai/openrouter_client.py`

## ⚠️ Mandatory: Initialize Before Use
```python
from ai.openrouter_client import init_openrouter_models, chat

# MUST call this first - fetches and caches /models
init_openrouter_models()
```

## Basic Chat
```python
response = chat(
    mode="default",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ],
    temperature=0.7
)
print(response)  # string content
```

## Reasoning Mode
```python
response = chat(
    mode="reasoning",  # Automatically uses reasoning models + effort:high
    messages=[
        {"role": "system", "content": "You are a rigorous reasoning assistant."},
        {"role": "user", "content": "Explain step by step..."}
    ],
    temperature=0.2
)
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

## API Endpoint Example
```python
from fastapi import FastAPI
from ai.openrouter_client import init_openrouter_models, chat

app = FastAPI()

@app.post("/ai/reason")
def reason(prompt: str):
    init_openrouter_models()  # Safe to call multiple times (cached)
    result = chat(
        mode="reasoning",
        messages=[{"role": "user", "content": prompt}]
    )
    return {"output": result}
```
