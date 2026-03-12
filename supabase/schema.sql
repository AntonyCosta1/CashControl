-- ═══════════════════════════════════════════════════════
--  CashControl – Schema PostgreSQL (Supabase)
--  Execute no SQL Editor do Supabase (New query → Run)
-- ═══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Grupos familiares ─────────────────────────────────
CREATE TABLE IF NOT EXISTS grupos (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome      TEXT NOT NULL DEFAULT 'Família',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ── Membros do grupo ──────────────────────────────────
-- Liga auth.users (Supabase Auth) com grupos
CREATE TABLE IF NOT EXISTS grupo_membros (
  grupo_id   UUID REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (grupo_id, usuario_id)
);

-- ── Perfis (nome visível) ─────────────────────────────
CREATE TABLE IF NOT EXISTS perfis (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  grupo_id  UUID REFERENCES grupos(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ── Despesas ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS despesas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id    UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id  UUID NOT NULL REFERENCES auth.users(id),
  descricao   TEXT NOT NULL,
  valor       NUMERIC(12,2) NOT NULL,
  categoria   TEXT NOT NULL,
  pagamento   TEXT,
  observacoes TEXT,
  data        DATE NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Investimentos ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS investimentos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id    UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id  UUID NOT NULL REFERENCES auth.users(id),
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  investido   NUMERIC(12,2) NOT NULL,
  atual       NUMERIC(12,2),
  data        DATE NOT NULL,
  observacoes TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_despesas_grupo ON despesas(grupo_id);
CREATE INDEX IF NOT EXISTS idx_despesas_data  ON despesas(data);
CREATE INDEX IF NOT EXISTS idx_inv_grupo      ON investimentos(grupo_id);

-- ── Row Level Security ────────────────────────────────
ALTER TABLE grupos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_membros  ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis         ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos  ENABLE ROW LEVEL SECURITY;

-- Perfis: usuário vê/edita só o próprio
CREATE POLICY "perfil_proprio" ON perfis
  USING (id = auth.uid());

-- Grupo: membros veem o próprio grupo
CREATE POLICY "grupo_membros_ver" ON grupos
  USING (
    id IN (SELECT grupo_id FROM grupo_membros WHERE usuario_id = auth.uid())
  );

-- Despesas: só quem é do mesmo grupo acessa
CREATE POLICY "despesas_grupo" ON despesas
  USING (
    grupo_id IN (SELECT grupo_id FROM grupo_membros WHERE usuario_id = auth.uid())
  );

-- Investimentos: idem
CREATE POLICY "investimentos_grupo" ON investimentos
  USING (
    grupo_id IN (SELECT grupo_id FROM grupo_membros WHERE usuario_id = auth.uid())
  );

-- ── Trigger: ao criar usuário, cria perfil+grupo ──────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  novo_grupo_id UUID;
BEGIN
  -- Cria grupo familiar
  INSERT INTO grupos (nome)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'nome_grupo', 'Família'))
  RETURNING id INTO novo_grupo_id;

  -- Cria perfil
  INSERT INTO perfis (id, nome, grupo_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    novo_grupo_id
  );

  -- Adiciona ao grupo
  INSERT INTO grupo_membros (grupo_id, usuario_id)
  VALUES (novo_grupo_id, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executa o trigger após cada novo cadastro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();