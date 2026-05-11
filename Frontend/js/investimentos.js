import { investimentosAPI, auth } from './api.js';

// ── Configuração de Tipos ─────────────────────────────────────────────────
const TIPOS = {
  'Ações':               { color: '#5b8fff', cls: 'badge-acoes',      emoji: '📈' },
  'Fundos Imobiliários': { color: '#c77dff', cls: 'badge-fundos',     emoji: '🏢' },
  'Tesouro Direto':      { color: '#43e5b0', cls: 'badge-tesouro',    emoji: '🏛' },
  'Criptomoedas':        { color: '#f9c74f', cls: 'badge-cripto',     emoji: '₿'  },
  'Renda Fixa':          { color: '#ff9fdb', cls: 'badge-rendafixa',  emoji: '💰' },
  'Poupança':            { color: '#80ffdb', cls: 'badge-poupanca',   emoji: '🐷' },
  'Outros':              { color: '#aaaaaa', cls: 'badge-inv-outros', emoji: '📦' },
};

// ── Estado ────────────────────────────────────────────────────────────────
let investimentos = [];
let pieInstance = null;

// ── Normalização dos dados vindos do banco ────────────────────────────────
function normalizarInvestimento(i) {
  return {
    id: i.id,
    nome: i.nome ?? '',
    tipo: i.tipo ?? 'Outros',
    investido: Number(i.investido ?? i.valor_investido ?? 0),
    atual: Number(i.atual ?? i.valor_atual ?? i.investido ?? i.valor_investido ?? 0),
    data: i.data ?? '',
    obs: i.obs ?? i.observacoes ?? '',
  };
}

// ── Banco / API ───────────────────────────────────────────────────────────
async function carregarInvestimentos() {
  try {
    const data = await investimentosAPI.listar();
    investimentos = Array.isArray(data) ? data.map(normalizarInvestimento) : [];
    renderAll();
  } catch (error) {
    console.error(error);
    alert('Erro ao carregar investimentos: ' + error.message);
  }
}

window.fazerLogout = function () {
  auth.logout();
};

// ── Formatação ────────────────────────────────────────────────────────────
function fmt(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtRent(investido, atual) {
  if (!investido || investido === 0) return '<span class="rent-zero">—</span>';

  const pct = ((atual - investido) / investido) * 100;
  const val = atual - investido;
  const sinal = pct >= 0 ? '+' : '';
  const cls = pct > 0 ? 'rent-pos' : pct < 0 ? 'rent-neg' : 'rent-zero';

  return `<span class="${cls}">${sinal}${pct.toFixed(2)}%<br><small>${sinal}${fmt(val)}</small></span>`;
}

// ── KPI Cards ─────────────────────────────────────────────────────────────
function renderKPIs() {
  const totalInvestido = investimentos.reduce((s, i) => s + i.investido, 0);
  const totalAtual = investimentos.reduce((s, i) => s + (i.atual || i.investido), 0);
  const lucro = totalAtual - totalInvestido;
  const rentPct = totalInvestido > 0 ? (lucro / totalInvestido) * 100 : 0;

  const melhor = [...investimentos].sort((a, b) => {
    const ra = a.investido ? ((a.atual || a.investido) - a.investido) / a.investido : 0;
    const rb = b.investido ? ((b.atual || b.investido) - b.investido) / b.investido : 0;
    return rb - ra;
  })[0];

  const kpiRow = document.getElementById('inv-kpi-row');
  if (!kpiRow) return;

  kpiRow.innerHTML = `
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
  const canvas = document.getElementById('invPieChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const grouped = investimentos.reduce((acc, i) => {
    acc[i.tipo] = (acc[i.tipo] || 0) + (i.atual || i.investido);
    return acc;
  }, {});

  const tipos = Object.keys(grouped);
  const vals = tipos.map(t => grouped[t]);
  const colors = tipos.map(t => TIPOS[t]?.color || '#aaa');

  if (pieInstance) pieInstance.destroy();

  pieInstance = new Chart(canvas, {
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
        legend: {
          labels: {
            color: '#e8ecf5',
            font: { family: 'DM Sans', size: 12 },
          },
        },
      },
      cutout: '62%',
    },
  });
}

// ── Tabela ────────────────────────────────────────────────────────────────
function renderTabela(data) {
  const tbody = document.getElementById('inv-tbody');
  if (!tbody) return;

  const sorted = [...data].sort((a, b) => String(b.data).localeCompare(String(a.data)));

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
          <button class="delete-btn" onclick="deleteInvestimento('${i.id}')" title="Remover">✕</button>
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
    await investimentosAPI.criar({
      nome,
      tipo,
      investido,
      atual,
      data,
      observacoes: obs,
    });

    document.getElementById('inv-nome').value = '';
    document.getElementById('inv-tipo').value = '';
    document.getElementById('inv-valor').value = '';
    document.getElementById('inv-atual').value = '';
    document.getElementById('inv-obs').value = '';

    const toast = document.getElementById('inv-toast');
    if (toast) {
      toast.style.display = 'block';
      setTimeout(() => (toast.style.display = 'none'), 2500);
    }

    await carregarInvestimentos();
  } catch (error) {
    console.error(error);
    alert('Erro ao salvar investimento: ' + error.message);
  }
}

// ── Deletar ───────────────────────────────────────────────────────────────
async function deleteInvestimento(id) {
  if (!confirm('Deseja remover este investimento?')) return;

  try {
    await investimentosAPI.deletar(id);
    await carregarInvestimentos();
  } catch (error) {
    console.error(error);
    alert('Erro ao remover investimento: ' + error.message);
  }
}

// ── Render geral ──────────────────────────────────────────────────────────
function renderAll() {
  renderKPIs();
  renderPieChart();
  renderTabela(investimentos);
}

// ── Expor funções globalmente ─────────────────────────────────────────────
window.addInvestimento = addInvestimento;
window.deleteInvestimento = deleteInvestimento;
window.filterInvestimentos = filterInvestimentos;

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const inputData = document.getElementById('inv-data');
  if (inputData) inputData.value = new Date().toISOString().split('T')[0];

  await carregarInvestimentos();
});
