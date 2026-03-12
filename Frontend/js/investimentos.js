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

// ── Seed ──────────────────────────────────────────────────────────────────
const SEED = [
  { id: 1, nome: 'PETR4',            tipo: 'Ações',               investido: 1500.00, atual: 1720.00, data: '2025-08-10', obs: 'Petrobras ON' },
  { id: 2, nome: 'HGLG11',           tipo: 'Fundos Imobiliários', investido: 800.00,  atual: 760.00,  data: '2025-09-05', obs: 'FII Logístico' },
  { id: 3, nome: 'Tesouro IPCA 2029',tipo: 'Tesouro Direto',      investido: 2000.00, atual: 2180.00, data: '2025-06-01', obs: '' },
  { id: 4, nome: 'Bitcoin',          tipo: 'Criptomoedas',        investido: 500.00,  atual: 640.00,  data: '2025-11-20', obs: 'Binance' },
  { id: 5, nome: 'CDB Banco Inter',  tipo: 'Renda Fixa',          investido: 3000.00, atual: 3120.00, data: '2025-07-15', obs: '110% CDI, venc. 2027' },
];

// ── Estado ────────────────────────────────────────────────────────────────
let investimentos = [];
let pieInstance   = null;

// ── Storage ───────────────────────────────────────────────────────────────
function loadInvestimentos() {
  const stored = localStorage.getItem('cc_investimentos');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('cc_investimentos', JSON.stringify(SEED));
  return [...SEED];
}

function saveInvestimentos() {
  localStorage.setItem('cc_investimentos', JSON.stringify(investimentos));
}

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
function addInvestimento() {
  const nome     = document.getElementById('inv-nome').value.trim();
  const tipo     = document.getElementById('inv-tipo').value;
  const investido = parseFloat(document.getElementById('inv-valor').value);
  const data     = document.getElementById('inv-data').value;
  const atual    = parseFloat(document.getElementById('inv-atual').value) || investido;
  const obs      = document.getElementById('inv-obs').value.trim();

  if (!nome || !tipo || !investido || !data) {
    alert('Preencha Nome, Tipo, Valor Investido e Data.');
    return;
  }

  investimentos.push({ id: Date.now(), nome, tipo, investido, atual, data, obs });
  saveInvestimentos();

  // Limpar campos
  document.getElementById('inv-nome').value  = '';
  document.getElementById('inv-tipo').value  = '';
  document.getElementById('inv-valor').value = '';
  document.getElementById('inv-atual').value = '';
  document.getElementById('inv-obs').value   = '';

  // Toast
  const toast = document.getElementById('inv-toast');
  toast.style.display = 'block';
  setTimeout(() => (toast.style.display = 'none'), 2500);

  renderAll();
}

// ── Deletar ───────────────────────────────────────────────────────────────
function deleteInvestimento(id) {
  investimentos = investimentos.filter(i => i.id !== id);
  saveInvestimentos();
  renderAll();
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