const SUPABASE_URL     = 'https://capldgdksjefougtspqr.supabase.co';
const SUPABASE_ANON_KEY = 'Ssb_publishable_LGFW_ekgbywrYAi_gxvbaA_FMzxFy_Q';
const FUNCTIONS_URL    = `${SUPABASE_URL}/functions/v1`;

// ── Helpers de sessão ─────────────────────────────────
function getToken() {
  const raw = localStorage.getItem(`sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`);
  if (!raw) return null;
  try { return JSON.parse(raw)?.access_token; } catch { return null; }
}

function getSession() {
  const raw = localStorage.getItem(`sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Requisição autenticada ────────────────────────────
async function req(method, fn, params = {}, body = null) {
  const token = getToken();
  const qs    = new URLSearchParams(params).toString();
  const url   = `${FUNCTIONS_URL}/${fn}${qs ? '?' + qs : ''}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    window.location.href = 'login.html';
    return;
  }

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

// ── Supabase Auth (via REST direto) ───────────────────
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;

async function authReq(path, body) {
  const res = await fetch(`${AUTH_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Erro na autenticação');
  return data;
}

// ── Auth ──────────────────────────────────────────────
export const auth = {
  async cadastro(nome, email, senha, nomeGrupo = 'Família') {
    const data = await authReq('/signup', {
      email, password: senha,
      data: { nome, nome_grupo: nomeGrupo },
    });
    if (data.access_token) {
      const key = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;
      localStorage.setItem(key, JSON.stringify(data));
    }
    return data;
  },

  async login(email, senha) {
    const data = await authReq('/token?grant_type=password', { email, password: senha });
    const key  = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  },

  logout() {
    const key = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;
    localStorage.removeItem(key);
    window.location.href = 'login.html';
  },

  isLogado() {
    return !!getToken();
  },

  getUsuario() {
    const s = getSession();
    return s?.user ?? null;
  },

  async convidar(emailConvidado) {
    return req('POST', 'convidar', {}, { email_convidado: emailConvidado });
  },
};

// ── Despesas ──────────────────────────────────────────
export const despesasAPI = {
  listar(mes = null) {
    return req('GET', 'despesas', mes ? { mes } : {});
  },
  criar(dados) {
    return req('POST', 'despesas', {}, dados);
  },
  atualizar(id, dados) {
    return req('PATCH', 'despesas', { id }, dados);
  },
  deletar(id) {
    return req('DELETE', 'despesas', { id });
  },
};

// ── Investimentos ─────────────────────────────────────
export const investimentosAPI = {
  listar() {
    return req('GET', 'investimentos', {});
  },
  resumo() {
    return req('GET', 'investimentos', { resumo: '1' });
  },
  criar(dados) {
    return req('POST', 'investimentos', {}, dados);
  },
  atualizar(id, dados) {
    return req('PATCH', 'investimentos', { id }, dados);
  },
  deletar(id) {
    return req('DELETE', 'investimentos', { id });
  },
};