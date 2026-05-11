from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from asyncpg import Connection

from db.database import get_db
from middleware.auth import get_usuario_atual

router = APIRouter(prefix="/despesas", tags=["Despesas"])

# ── Schemas ───────────────────────────────────────────
class DespesaInput(BaseModel):
    descricao:   str
    valor:       float
    categoria:   str
    pagamento:   Optional[str] = None
    observacoes: Optional[str] = None
    data:        date

class DespesaUpdate(BaseModel):
    descricao:   Optional[str] = None
    valor:       Optional[float] = None
    categoria:   Optional[str] = None
    pagamento:   Optional[str] = None
    observacoes: Optional[str] = None
    data:        Optional[date] = None

# ── Listar ────────────────────────────────────────────
@router.get("/")
async def listar(
    mes: Optional[str] = None,   # formato: "2026-03"
    db: Connection = Depends(get_db),
    atual: dict = Depends(get_usuario_atual),
):
    if mes:
        rows = await db.fetch(
            """
            SELECT d.*, u.nome AS autor
            FROM despesas d
            JOIN usuarios u ON u.id = d.usuario_id
            WHERE d.grupo_id=$1
              AND TO_CHAR(d.data, 'YYYY-MM') = $2
            ORDER BY d.data DESC
            """,
            atual["grupo_id"], mes
        )
    else:
        rows = await db.fetch(
            """
            SELECT d.*, u.nome AS autor
            FROM despesas d
            JOIN usuarios u ON u.id = d.usuario_id
            WHERE d.grupo_id=$1
            ORDER BY d.data DESC
            LIMIT 200
            """,
            atual["grupo_id"]
        )
    return [dict(r) for r in rows]

# ── Criar ─────────────────────────────────────────────
@router.post("/", status_code=201)
async def criar(
    body: DespesaInput,
    db: Connection = Depends(get_db),
    atual: dict = Depends(get_usuario_atual),
):
    row = await db.fetchrow(
        """
        INSERT INTO despesas
          (grupo_id, usuario_id, descricao, valor, categoria, pagamento, observacoes, data)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
        """,
        atual["grupo_id"], atual["usuario_id"],
        body.descricao, body.valor, body.categoria,
        body.pagamento, body.observacoes, body.data,
    )
    return dict(row)

# ── Atualizar ─────────────────────────────────────────
@router.patch("/{despesa_id}")
async def atualizar(
    despesa_id: str,
    body: DespesaUpdate,
    db: Connection = Depends(get_db),
    atual: dict = Depends(get_usuario_atual),
):
    despesa = await db.fetchrow(
        "SELECT * FROM despesas WHERE id=$1 AND grupo_id=$2",
        despesa_id, atual["grupo_id"]
    )
    if not despesa:
        raise HTTPException(404, "Despesa não encontrada.")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        return dict(despesa)

    campos = ", ".join(f"{k}=${i+2}" for i, k in enumerate(updates))
    valores = list(updates.values())
    await db.execute(
        f"UPDATE despesas SET {campos} WHERE id=$1",
        despesa_id, *valores
    )
    return {**dict(despesa), **updates}

# ── Deletar ───────────────────────────────────────────
@router.delete("/{despesa_id}", status_code=204)
async def deletar(
    despesa_id: str,
    db: Connection = Depends(get_db),
    atual: dict = Depends(get_usuario_atual),
):
    result = await db.execute(
        "DELETE FROM despesas WHERE id=$1 AND grupo_id=$2",
        despesa_id, atual["grupo_id"]
    )
    if result == "DELETE 0":
        raise HTTPException(404, "Despesa não encontrada.")

# ── Relatório por categoria ───────────────────────────
@router.get("/relatorio/categorias")
async def relatorio_categorias(
    mes: Optional[str] = None,
    db: Connection = Depends(get_db),
    atual: dict = Depends(get_usuario_atual),
):
    query = """
        SELECT categoria, SUM(valor) AS total, COUNT(*) AS quantidade
        FROM despesas
        WHERE grupo_id=$1
    """
    params = [atual["grupo_id"]]
    if mes:
        query += " AND TO_CHAR(data, 'YYYY-MM') = $2"
        params.append(mes)
    query += " GROUP BY categoria ORDER BY total DESC"

    rows = await db.fetch(query, *params)
    return [dict(r) for r in rows]