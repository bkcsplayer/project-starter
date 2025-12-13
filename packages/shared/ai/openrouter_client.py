# packages/shared/ai/openrouter_client.py
# OpenRouter wrapper (stdlib only): fetch /models on startup, pick reasoning model, and chat with fallbacks.

import json
import os
import re
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional, Tuple

BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
API_KEY  = os.getenv("OPENROUTER_API_KEY", "")
APP_URL  = os.getenv("APP_URL", "http://localhost")
APP_NAME = os.getenv("APP_NAME", "cursor-prototype")

PIN_REASONING_MODEL = os.getenv("OPENROUTER_REASONING_MODEL")
PIN_DEFAULT_MODEL   = os.getenv("OPENROUTER_DEFAULT_MODEL")

_cached_models: Optional[List[Dict[str, Any]]] = None

def _must_key():
    if not API_KEY:
        raise RuntimeError("Missing OPENROUTER_API_KEY")

def _http_json(method: str, path: str, body: Optional[Dict[str, Any]] = None) -> Any:
    _must_key()
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url=f"{BASE_URL}{path}",
        method=method,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": APP_URL,
            "X-Title": APP_NAME,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"OpenRouter HTTP {e.code} {e.reason}: {raw}".strip())

def init_openrouter_models() -> List[Dict[str, Any]]:
    global _cached_models
    if _cached_models is not None:
        return _cached_models
    payload = _http_json("GET", "/models")
    models = payload if isinstance(payload, list) else payload.get("data", [])
    _cached_models = [m for m in models if isinstance(m, dict) and isinstance(m.get("id"), str)]
    return _cached_models

def _is_reasoning(m: Dict[str, Any]) -> bool:
    sp = m.get("supported_parameters") or []
    if isinstance(sp, list) and "reasoning" in sp:
        return True
    hay = f"{m.get('id','')} {m.get('name','')}".lower()
    return re.search(r"(reasoning|thinking|\bo1\b|\br1\b)", hay) is not None

def _pick(models: List[Dict[str, Any]], mode: str) -> Tuple[str, List[str]]:
    pinned = PIN_REASONING_MODEL if mode == "reasoning" else PIN_DEFAULT_MODEL
    ids = {m.get("id") for m in models}
    pool = [m for m in models if _is_reasoning(m)] if mode == "reasoning" else list(models)
    if pinned and pinned in ids:
        fb = [m["id"] for m in pool if m.get("id") != pinned][:2]
        return pinned, fb
    primary = (pool[0]["id"] if pool else ("openai/o1" if mode=="reasoning" else "openai/gpt-4o-mini"))
    fb = [m["id"] for m in pool if m.get("id") != primary][:2]
    return primary, fb

def chat(messages: List[Dict[str, str]], mode: str = "default", temperature: float = 0.2, max_tokens: Optional[int] = None) -> str:
    models = _cached_models or init_openrouter_models()
    primary, fallbacks = _pick(models, mode)
    body: Dict[str, Any] = {
        "model": primary,
        "models": [primary] + fallbacks,
        "messages": messages,
        "temperature": temperature,
    }
    if max_tokens is not None:
        body["max_tokens"] = max_tokens
    if mode == "reasoning":
        body["reasoning"] = {"effort": "high"}

    resp = _http_json("POST", "/chat/completions", body)
    return resp["choices"][0]["message"]["content"]
