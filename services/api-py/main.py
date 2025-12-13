from fastapi import FastAPI
from pydantic import BaseModel
from ai.openrouter_client import init_openrouter_models, chat

app = FastAPI(title="api-py")

class ReasonReq(BaseModel):
    prompt: str | None = None

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/api/hello")
def hello():
    return {"message": "Hello from Python (FastAPI)!"}

@app.post("/api/ai/reason")
def ai_reason(req: ReasonReq):
    init_openrouter_models()  # MUST call /models first per run
    prompt = req.prompt or "用严谨逻辑解释为什么要先拉取模型列表再选择推理模型。"
    out = chat(
        mode="reasoning",
        messages=[
            {"role": "system", "content": "你是严谨的推理助手。请给出清晰步骤与结论。"},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return {"output": out}
