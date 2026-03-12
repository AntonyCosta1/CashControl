// ══════════════════════════════════════════════════════
//  api.js — Comunicação com o backend CashControl
//  Substitui o localStorage por chamadas reais à API
// ══════════════════════════════════════════════════════

// ← Troque pela URL do seu backend no Railway após o deploy
const API_URL = 'https://cashcontrol-api.railway.app';

// ── Helpers internos ──────────────────────────────────
function getToken() {
  return localStorage.getItem('cc_token');
}

function setSession(data) {
  localStorage.setItem('cc_token',    data.access_token);
  localStorage.setItem('cc_usuario',  JSON.stringify(data.usuario));
  localStorage.setItem('cc_grupo_id', data.grupo_id);
}

function clearSession() {
  localStorage.removeItem('cc_token');
  localStorage.removeItem('cc_usuario');
  localStorage.removeItem('cc_grupo_id');
}

async function req(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearSession();
    window.location.href = 'login.html';
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────
export const auth = {
  async cadastro(nome, email, senha, nomeGrupo = 'Família') {
    const data = await req('POST', '/auth/cadastro', { nome, email, senha, nome_grupo: nomeGrupo });
    setSession(data);
    return data;
  },

  async login(email, senha) {
    const data = await req('POST', '/auth/login', { email, senha });
    setSession(data);
    return data;
  },

  async convidar(emailConvidado) {
    return req('POST', '/auth/convidar', { email_convidado: emailConvidado });
  },

  logout() {
    clearSession();
    window.location.href = 'login.html';
  },

  isLogado() {
    return !!getToken();
  },

  getUsuario() {
    const u = localStorage.getItem('cc_usuario');
    return u ? JSON.parse(u) : null;
  },
};

// ── Despesas ──────────────────────────────────────────
export const despesasAPI = {
  listar(mes = null) {
    const qs = mes ? `?mes=${mes}` : '';
    return req('GET', `/despesas/${qs}`);
  },

  criar(dados) {
    return req('POST', '/despesas/', dados);
  },

  atualizar(id, dados) {
    return req('PATCH', `/despesas/${id}`, dados);
  },

  deletar(id) {
    return req('DELETE', `/despesas/${id}`);
  },

  relatorioCategorias(mes = null) {
    const qs = mes ? `?mes=${mes}` : '';
    return req('GET', `/despesas/relatorio/categorias${qs}`);
  },
};

// ── Investimentos ─────────────────────────────────────
export const investimentosAPI = {
  listar() {
    return req('GET', '/investimentos/');
  },

  criar(dados) {
    return req('POST', '/investimentos/', dados);
  },

  atualizar(id, dados) {
    return req('PATCH', `/investimentos/${id}`, dados);
  },

  deletar(id) {
    return req('DELETE', `/investimentos/${id}`);
  },

  resumo() {
    return req('GET', '/investimentos/resumo');
  },
};