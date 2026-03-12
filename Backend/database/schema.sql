-- ═══════════════════════════════════════════════════════
--  CashControl – Schema PostgreSQL (Supabase)
--  Execute este arquivo no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════

-- ── Extensão para UUID ────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tabela de usuários ────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela de grupos familiares ───────────────────────
-- Permite que você e sua esposa compartilhem os dados
CREATE TABLE IF NOT EXISTS grupos (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome      TEXT NOT NULL DEFAULT 'Família',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ── Membros de cada grupo ─────────────────────────────
CREATE TABLE IF NOT EXISTS grupo_membros (
  grupo_id   UUID REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  PRIMARY KEY (grupo_id, usuario_id)
);

-- ── Tabela de despesas ────────────────────────────────
CREATE TABLE IF NOT EXISTS despesas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id    UUID REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id),
  descricao   TEXT NOT NULL,
  valor       NUMERIC(12, 2) NOT NULL,
  categoria   TEXT NOT NULL,
  pagamento   TEXT,
  observacoes TEXT,
  data        DATE NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela de investimentos ───────────────────────────
CREATE TABLE IF NOT EXISTS investimentos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id    UUID REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES usuarios(id),
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  investido   NUMERIC(12, 2) NOT NULL,
  atual       NUMERIC(12, 2),
  data        DATE NOT NULL,
  observacoes TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices para performance ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_despesas_grupo    ON despesas(grupo_id);
CREATE INDEX IF NOT EXISTS idx_despesas_data     ON despesas(data);
CREATE INDEX IF NOT EXISTS idx_investimentos_grupo ON investimentos(grupo_id);

-- ── Row Level Security (RLS) ──────────────────────────
-- Garante que cada grupo só acessa seus próprios dados
ALTER TABLE despesas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_membros ENABLE ROW LEVEL SECURITY;