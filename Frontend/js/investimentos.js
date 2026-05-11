import { investimentosAPI, getMeuPerfil } from "./api.js";

// ── Configuração de Tipos ─────────────────────────────────────────────────
const TIPOS = {
  'Ações':              { color: '#5b8fff', cls: 'badge-acoes',      emoji: '📈' },
  'Fundos Imobiliários':{ color: '#c77dff', cls: 'badge-fundos',     emoji: '🏢' },
  'Tesouro Direto':     { color: '#43e5b0', cls: 'badge-tesouro',    emoji: '🏛' },
  'Criptomoedas':       { color: '#f9c74f', cls: 'badge-cripto',     emoji: '₿'  },
  'Renda Fixa':         { color: '#ff9fdb', cls: 'badge-rendafixa',  emoji: '💰' },
  'Poupança':           { color: '#80ffdb', cls: 'badge-poupanca',   emoji: '🐷' },
  'Outros':             { color: '#aaaaaa', cls: 'badge-inv-outros', emoji: '📦' },
};


// ── Estado ────────────────────────────────────────────────────────────────
let investimentos = [];
let pieInstance   = null;

// ── Storage ───────────────────────────────────────────────────────────────
async function carregarInvestimentos() {
  try {
    const data = await investimentosAPI.listar();

    investimentos = data.map(i => ({
      id: i.id,
      nome: i.nome,
      tipo: i.tipo,
      investido: Number(i.investido),
      atual: Number(i.atual),
      data: i.data,
      obs: i.observacoes || ''
    }));

    renderAll();

  } catch (error) {
    console.error(error);
    alert('Erro ao carregar investimentos: ' + error.message);
  }
}


window.fazerLogout = function() {
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

// ── Formatação ────────────────────────────────────────────────────────────
function fmt(v) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtRent(investido, atual) {
  if (!investido || investido === 0) return '<span class="rent-zero">—</span>';
  const pct = ((atual - investido) / investido) * 100;
  const val = atual - investido;
  const sinal = pct >= 0 ? '+' : '';
  const cls   = pct > 0 ? 'rent-pos' : pct < 0 ? 'rent-neg' : 'rent-zero';
  return `<span class="${cls}">${sinal}${pct.toFixed(2)}%<br><small>${sinal}${fmt(val)}</small></span>`;
}

// ── KPI Cards ─────────────────────────────────────────────────────────────
function renderKPIs() {
  const totalInvestido = investimentos.reduce((s, i) => s + i.investido, 0);
  const totalAtual     = investimentos.reduce((s, i) => s + (i.atual || i.investido), 0);
  const lucro          = totalAtual - totalInvestido;
  const rentPct        = totalInvestido > 0 ? (lucro / totalInvestido) * 100 : 0;

  const melhor = [...investimentos].sort((a, b) => {
    const ra = ((a.atual || a.investido) - a.investido) / a.investido;
    const rb = ((b.atual || b.investido) - b.investido) / b.investido;
    return rb - ra;
  })[0];

  document.getElementById('inv-kpi-row').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total Investido</div>
      <div class="kpi-value">${fmt(totalInvestido)}</div>
      <div class="kpi-sub">${investimentos.length} ativos</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">Valor Atual</div>
      <div class="kpi-value">${fmt(totalAtual)}</div>
      <div class="kpi-sub">patrimônio total</div>
    </div>
    <div class="kpi-card ${lucro >= 0 ? 'green' : 'red'}">
      <div class="kpi-label">Lucro / Prejuízo</div>
      <div class="kpi-value">${lucro >= 0 ? '+' : ''}${fmt(lucro)}</div>
      <div class="kpi-sub">${lucro >= 0 ? '+' : ''}${rentPct.toFixed(2)}% no total</div>
    </div>
    <div class="kpi-card yellow">
      <div class="kpi-label">Melhor Ativo</div>
      <div class="kpi-value" style="font-size:1.2rem">${melhor ? melhor.nome : '—'}</div>
      <div class="kpi-sub">${melhor ? fmt(melhor.atual || melhor.investido) : ''}</div>
    </div>
  `;
}

// ── Gráfico de alocação ───────────────────────────────────────────────────
function renderPieChart() {
  const grouped = investimentos.reduce((acc, i) => {
    acc[i.tipo] = (acc[i.tipo] || 0) + (i.atual || i.investido);
    return acc;
  }, {});

  const tipos  = Object.keys(grouped);
  const vals   = tipos.map(t => grouped[t]);
  const colors = tipos.map(t => TIPOS[t]?.color || '#aaa');

  if (pieInstance) pieInstance.destroy();

  pieInstance = new Chart(document.getElementById('invPieChart'), {
    type: 'doughnut',
    data: {
      labels: tipos,
      datasets: [{
        data: vals,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#131726',
        hoverOffset: 6,
      }],
    },
    options: {
      plugins: {
        legend: { labels: { color: '#e8ecf5', font: { family: 'DM Sans', size: 12 } } },
      },
      cutout: '62%',
    },
  });
}

// ── Tabela ────────────────────────────────────────────────────────────────
function renderTabela(data) {
  const sorted = [...data].sort((a, b) => b.data.localeCompare(a.data));
  const tbody  = document.getElementById('inv-tbody');

  tbody.innerHTML = sorted.map(i => {
    const atual = i.atual ?? i.investido;
    return `
      <tr>
        <td>
          <strong>${i.nome}</strong>
          ${i.obs ? `<br><small style="color:var(--muted)">${i.obs}</small>` : ''}
        </td>
        <td><span class="badge ${TIPOS[i.tipo]?.cls || 'badge-inv-outros'}">${TIPOS[i.tipo]?.emoji || ''} ${i.tipo}</span></td>
        <td style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent)">${fmt(i.investido)}</td>
        <td style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent3)">${fmt(atual)}</td>
        <td>${fmtRent(i.investido, atual)}</td>
        <td style="color:var(--muted)">${fmtDate(i.data)}</td>
        <td>
          <button class="delete-btn" onclick="deleteInvestimento(${i.id})" title="Remover">✕</button>
        </td>
      </tr>
    `;
  }).join('') || `
    <tr>
      <td colspan="7" style="text-align:center;color:var(--muted);padding:30px">
        Nenhum investimento registrado.
      </td>
    </tr>`;
}

function filterInvestimentos(query) {
  const q = query.toLowerCase();
  const filtered = q
    ? investimentos.filter(i =>
        i.nome.toLowerCase().includes(q) ||
        i.tipo.toLowerCase().includes(q))
    : investimentos;
  renderTabela(filtered);
}

// ── Adicionar ─────────────────────────────────────────────────────────────
async function addInvestimento() {
  const nome = document.getElementById('inv-nome').value.trim();
  const tipo = document.getElementById('inv-tipo').value;
  const investido = parseFloat(document.getElementById('inv-valor').value);
  const data = document.getElementById('inv-data').value;
  const atual = parseFloat(document.getElementById('inv-atual').value) || investido;
  const obs = document.getElementById('inv-obs').value.trim();

  if (!nome || !tipo || !investido || !data) {
    alert('Preencha Nome, Tipo, Valor Investido e Data.');
    return;
  }

  try {
    const perfil = await getMeuPerfil();

    await investimentosAPI.criar({
      nome,
      tipo,
      investido,
      atual,
      data,
      observacoes: obs,
      usuario_id: perfil.id,
      grupo_id: perfil.grupo_id
    });

    await carregarInvestimentos();

    document.getElementById('inv-nome').value = '';
    document.getElementById('inv-tipo').value = '';
    document.getElementById('inv-valor').value = '';
    document.getElementById('inv-atual').value = '';
    document.getElementById('inv-obs').value = '';

    const toast = document.getElementById('inv-toast');
    toast.style.display = 'block';
    setTimeout(() => (toast.style.display = 'none'), 2500);

  } catch (error) {
    console.error(error);
    alert('Erro ao salvar investimento: ' + error.message);
  }
}async function addInvestimento() {
  const nome = document.getElementById('inv-nome').value.trim();
  const tipo = document.getElementById('inv-tipo').value;
  const investido = parseFloat(document.getElementById('inv-valor').value);
  const data = document.getElementById('inv-data').value;
  const atual = parseFloat(document.getElementById('inv-atual').value) || investido;
  const obs = document.getElementById('inv-obs').value.trim();

  if (!nome || !tipo || !investido || !data) {
    alert('Preencha Nome, Tipo, Valor Investido e Data.');
    return;
  }

  try {
    const perfil = await getMeuPerfil();

    await investimentosAPI.criar({
      nome,
      tipo,
      investido,
      atual,
      data,
      observacoes: obs,
      usuario_id: perfil.id,
      grupo_id: perfil.grupo_id
    });

    await carregarInvestimentos();

    document.getElementById('inv-nome').value = '';
    document.getElementById('inv-tipo').value = '';
    document.getElementById('inv-valor').value = '';
    document.getElementById('inv-atual').value = '';
    document.getElementById('inv-obs').value = '';

    const toast = document.getElementById('inv-toast');
    toast.style.display = 'block';
    setTimeout(() => (toast.style.display = 'none'), 2500);

  } catch (error) {
    console.error(error);
    alert('Erro ao salvar investimento: ' + error.message);
  }
}

// ── Deletar ───────────────────────────────────────────────────────────────
async function deleteInvestimento(id) {

  try {

    await investimentosAPI.deletar(id);

    await carregarInvestimentos();

  } catch (error) {
    console.error(error);
    alert('Erro ao excluir investimento: ' + error.message);
  }
}

// ── Render geral ──────────────────────────────────────────────────────────
function renderAll() {
  renderKPIs();
  renderPieChart();
  renderTabela(investimentos);
}

// ── Init ──────────────────────────────────────────────────────────────────
investimentos = loadInvestimentos();
document.getElementById('inv-data').value = new Date().toISOString().split('T')[0];
renderAll();

window.addInvestimento = addInvestimento;
window.deleteInvestimento = deleteInvestimento;
window.filterInvestimentos = filterInvestimentos;