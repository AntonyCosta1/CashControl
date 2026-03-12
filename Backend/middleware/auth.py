import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "dev_secret_troque_em_producao")
ALGORITHM  = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MINUTES", 10080))  # 7 dias

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── Gerar token ───────────────────────────────────────
def criar_token(usuario_id: str, grupo_id: str) -> str:
    expira = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    payload = {
        "sub": str(usuario_id),
        "grupo_id": str(grupo_id),
        "exp": expira,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ── Validar token e retornar usuário atual ────────────
def get_usuario_atual(token: str = Depends(oauth2_scheme)) -> dict:
    erro = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: Optional[str] = payload.get("sub")
        grupo_id:   Optional[str] = payload.get("grupo_id")
        if not usuario_id or not grupo_id:
            raise erro
        return {"usuario_id": usuario_id, "grupo_id": grupo_id}
    except JWTError:
        raise erro