"""
FastAPI backend with PostgreSQL, admin users API, and OpenRouter integration.
"""
import os
from datetime import datetime
from typing import Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json

from db import get_cursor, health_check, wait_for_db
from ai.openrouter_client import init_openrouter_models, chat


# --- Models ---

class User(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    updated_at: datetime


class UsersListResponse(BaseModel):
    data: list[User]
    total: int


class UserResponse(BaseModel):
    data: User


class ApiError(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ReasonRequest(BaseModel):
    prompt: Optional[str] = None


class ReasonResponse(BaseModel):
    output: str
    model: str


# --- App lifecycle ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Wait for database on startup."""
    wait_for_db()
    yield


app = FastAPI(title="api-py", lifespan=lifespan)


# --- Error handler ---

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": "HTTP_ERROR", "message": exc.detail}
    )


# --- Routes ---

@app.get("/healthz")
def healthz():
    """Health check endpoint."""
    db_ok = health_check()
    return {"ok": db_ok, "ts": datetime.utcnow().isoformat()}


@app.get("/hello")
def hello():
    """Hello endpoint."""
    return {"message": "hello", "backend": "py"}


@app.get("/admin/users", response_model=UsersListResponse)
def list_users(
    range: Optional[str] = Query(None, alias="range"),
    sort: Optional[str] = Query(None, alias="sort")
):
    """
    List users with React-Admin compatible pagination.
    
    Query params:
    - range: JSON array like [0, 24] for pagination
    - sort: JSON array like ["created_at", "DESC"] for sorting
    """
    # Parse pagination
    offset = 0
    limit = 25
    
    if range:
        try:
            range_arr = json.loads(range)
            if len(range_arr) == 2:
                offset = range_arr[0]
                limit = range_arr[1] - range_arr[0] + 1
        except (json.JSONDecodeError, IndexError):
            pass
    
    # Parse sorting
    order_by = "created_at"
    order_dir = "DESC"
    allowed_fields = {"id", "name", "email", "created_at", "updated_at"}
    
    if sort:
        try:
            sort_arr = json.loads(sort)
            if len(sort_arr) == 2 and sort_arr[0] in allowed_fields:
                order_by = sort_arr[0]
                order_dir = "ASC" if sort_arr[1] == "ASC" else "DESC"
        except (json.JSONDecodeError, IndexError):
            pass
    
    try:
        with get_cursor() as cur:
            # Get total count
            cur.execute("SELECT COUNT(*) as count FROM users")
            total = cur.fetchone()["count"]
            
            # Get users with pagination and sorting
            # Note: Using string formatting for column name is safe here because we validated against allowed_fields
            cur.execute(
                f"SELECT id, name, email, created_at, updated_at FROM users ORDER BY {order_by} {order_dir} LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = cur.fetchall()
            
            users = [User(**row) for row in rows]
            
            # Return with Content-Range header info embedded (FastAPI will handle the response)
            return UsersListResponse(data=users, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@app.get("/admin/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    """Get a single user by ID."""
    try:
        with get_cursor() as cur:
            cur.execute(
                "SELECT id, name, email, created_at, updated_at FROM users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"User {user_id} not found")
            
            return UserResponse(data=User(**row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {str(e)}")


@app.post("/ai/reason", response_model=ReasonResponse)
def ai_reason(req: ReasonRequest):
    """OpenRouter reasoning endpoint."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    
    if not api_key or api_key == "your_openrouter_key":
        raise HTTPException(
            status_code=400,
            detail="OPENROUTER_API_KEY is not configured. Please set it in your .env file. Get your API key from https://openrouter.ai/keys"
        )
    
    try:
        # MUST call /models first per run
        init_openrouter_models()
        
        prompt = req.prompt or "Explain why we must fetch /models before picking a reasoning model."
        
        output = chat(
            mode="reasoning",
            messages=[
                {"role": "system", "content": "You are a rigorous reasoning assistant. Provide clear steps and conclusions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        
        return ReasonResponse(output=output, model="reasoning")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI reasoning failed: {str(e)}")
