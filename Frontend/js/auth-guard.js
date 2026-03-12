// ── auth-guard.js ─────────────────────────────────────
// Inclua esse script em TODAS as páginas protegidas
// (index.html e investimentos.html)
// Deve vir ANTES do app.js / investimentos.js

(function () {
  const SUPABASE_URL = window.SUPABASE_URL || '';

  // Pega o token da sessão do Supabase
  function getToken() {
    // Supabase salva a sessão com a chave baseada no projeto
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('auth-token')) {
        try {
          const val = JSON.parse(localStorage.getItem(key));
          if (val?.access_token) return val.access_token;
        } catch (_) {}
      }
    }
    return null;
  }

  // Verifica se o token ainda não expirou
  function tokenValido(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (_) {
      return false;
    }
  }

  const token = getToken();

  if (!token || !tokenValido(token)) {
    // Não logado ou token expirado → vai para login
    window.location.href = 'login.html';
    return;
  }

  // Expõe função de logout globalmente
  window.fazerLogout = function () {
    // Remove todas as chaves de sessão do Supabase
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth-token') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.href = 'login.html';
  };
})();