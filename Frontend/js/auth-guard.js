import { auth, getToken, tokenValido } from './api.js';

(function () {
  const token = getToken();

  if (!token || !tokenValido(token)) {
    window.location.href = 'login.html';
    return;
  }

  window.fazerLogout = function () {
    auth.logout();
  };
})();
