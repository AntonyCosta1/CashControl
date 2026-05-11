import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes import auth, despesas, investimentos

load_dotenv()

app = FastAPI(
    title="CashControl API",
    description="Backend do CashControl — controle de gastos e investimentos familiar",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:5500"),
    "http://localhost:3000",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rotas ─────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(despesas.router)
app.include_router(investimentos.router)

# ── Health check ──────────────────────────────────────
@app.get("/", tags=["Status"])
async def root():
    return {"status": "ok", "app": "CashControl API v1.0"}