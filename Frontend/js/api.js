const SUPABASE_URL = 'https://gjquafybaidptzpgmbsq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F8jMtjU4DtQaD5Op2pcufg_6aZWHCf-';
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// ── Helpers de sessão ─────────────────────────────────
function getProjectRef() {
  return SUPABASE_URL.split('//')[1].split('.')[0];
}

function getStorageKey() {
  return `sb-${getProjectRef()}-auth-token`;
}

export function getToken() {
  const raw = localStorage.getItem(getStorageKey());
  if (!raw) return null;

  try {
    return JSON.parse(raw)?.access_token || null;
  } catch {
    return null;
  }
}

export function getSession() {
  const raw = localStorage.getItem(getStorageKey());
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function tokenValido(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// ── Requisição autenticada para Supabase Edge Functions ───────────────────
async function req(method, fn, params = {}, body = null) {
  const token = getToken();

  if (!token || !tokenValido(token)) {
    window.location.href = 'login.html';
    return;
  }

  const qs = new URLSearchParams(params).toString();
  const url = `${FUNCTIONS_URL}/${fn}${qs ? '?' + qs : ''}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    auth.logout();
    return;
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Erro ${res.status}`);
  }

  return data;
}

// ── Supabase Auth via REST direto ─────────────────────────────────────────
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

  if (!res.ok) {
    throw new Error(data.error_description || data.msg || data.message || 'Erro na autenticação');
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  async cadastro(nome, email, senha, nomeGrupo = 'Família') {
    const data = await authReq('/signup', {
      email,
      password: senha,
      data: {
        nome,
        nome_grupo: nomeGrupo,
      },
    });

    if (data.access_token) {
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
    }

    return data;
  },

  async login(email, senha) {
    const data = await authReq('/token?grant_type=password', {
      email,
      password: senha,
    });

    localStorage.setItem(getStorageKey(), JSON.stringify(data));
    return data;
  },

  logout() {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth-token') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.href = 'login.html';
  },

  isLogado() {
    const token = getToken();
    return !!token && tokenValido(token);
  },

  getUsuario() {
    const s = getSession();
    return s?.user ?? null;
  },

  async convidar(emailConvidado) {
    return req('POST', 'convidar', {}, { email_convidado: emailConvidado });
  },
};

// ── Despesas ──────────────────────────────────────────────────────────────
// As Edge Functions precisam existir no Supabase com estes nomes:
// despesas: GET, POST, PATCH, DELETE
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

// ── Investimentos ─────────────────────────────────────────────────────────
// As Edge Functions precisam existir no Supabase com estes nomes:
// investimentos: GET, POST, PATCH, DELETE
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
