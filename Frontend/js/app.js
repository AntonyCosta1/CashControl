// ── Configuração de Categorias ────────────────────────────────────────────
const CATS = {
  'Alimentação': { color: '#5b8fff', cls: 'badge-alimentacao' },
  'Transporte':  { color: '#43e5b0', cls: 'badge-transporte'  },
  'Lazer':       { color: '#f9c74f', cls: 'badge-lazer'       },
  'Saúde':       { color: '#ff6b6b', cls: 'badge-saude'       },
  'Moradia':     { color: '#c77dff', cls: 'badge-moradia'     },
  'Casamento':   { color: '#ff9fdb', cls: 'badge-casamento'   },
  'Outros':      { color: '#aaaaaa', cls: 'badge-outros'      },
};

// ── Seed data ─────────────────────────────────────────────────────────────
const SEED = [
  { id: 1,  desc: 'Supermercado', cat: 'Alimentação', val: 320.50, date: '2026-02-05', pay: 'Cartão de Débito',  obs: '' },
  { id: 2,  desc: 'Uber',         cat: 'Transporte',  val: 45.00,  date: '2026-02-08', pay: 'Pix',              obs: '' },
  { id: 3,  desc: 'Netflix',      cat: 'Lazer',       val: 39.90,  date: '2026-02-10', pay: 'Cartão de Crédito',obs: '' },
  { id: 4,  desc: 'Farmácia',     cat: 'Saúde',       val: 85.00,  date: '2026-02-15', pay: 'Cartão de Débito', obs: '' },
  { id: 5,  desc: 'Aluguel',      cat: 'Moradia',     val: 1200.0, date: '2026-02-01', pay: 'Pix',              obs: '' },
  { id: 6,  desc: 'Restaurante',  cat: 'Alimentação', val: 95.00,  date: '2026-03-02', pay: 'Cartão de Crédito',obs: '' },
  { id: 7,  desc: 'Gasolina',     cat: 'Transporte',  val: 160.00, date: '2026-03-04', pay: 'Cartão de Débito', obs: '' },
  { id: 8,  desc: 'Aluguel',      cat: 'Moradia',     val: 1200.0, date: '2026-03-01', pay: 'Pix',              obs: '' },
  { id: 9,  desc: 'Streaming',    cat: 'Lazer',       val: 55.90,  date: '2026-03-10', pay: 'Cartão de Crédito',obs: '' },
  { id: 10, desc: 'Academia',     cat: 'Saúde',       val: 99.00,  date: '2026-03-05', pay: 'Cartão de Crédito',obs: '' },
];

// ── Estado ────────────────────────────────────────────────────────────────
let expenses = [];
let pieInstance  = null;
let lineInstance = null;
let barInstance  = null;

// ── Storage ───────────────────────────────────────────────────────────────
function loadExpenses() {
  const stored = localStorage.getItem('cc_expenses');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('cc_expenses', JSON.stringify(SEED));
  return [...SEED];
}

function saveExpenses() {
  localStorage.setItem('cc_expenses', JSON.stringify(expenses));
}

// ── Formatação ────────────────────────────────────────────────────────────
function fmt(v) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtMonth(m) {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

function sumByCat(data) {
  return data.reduce((acc, e) => {
    acc[e.cat] = (acc[e.cat] || 0) + e.val;
    return acc;
  }, {});
}

function getLast6Months() {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

// ── Navegação ─────────────────────────────────────────────────────────────
function showView(id, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  if (btn) btn.classList.add('active');

  if (id === 'dashboard') renderDashboard();
  if (id === 'relatorios') { buildMonthFilter(); renderReports(); }
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function renderDashboard() {
  const total      = expenses.reduce((s, e) => s + e.val, 0);
  const now        = new Date();
  const prefix     = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth  = expenses.filter(e => e.date.startsWith(prefix));
  const monthTotal = thisMonth.reduce((s, e) => s + e.val, 0);
  const maxCat     = Object.entries(sumByCat(expenses)).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
  const avg        = expenses.length ? total / expenses.length : 0;

  document.getElementById('kpi-row').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total Geral</div>
      <div class="kpi-value">${fmt(total)}</div>
      <div class="kpi-sub">${expenses.length} lançamentos</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">Este Mês</div>
      <div class="kpi-value">${fmt(monthTotal)}</div>
      <div class="kpi-sub">${thisMonth.length} lançamentos</div>
    </div>
    <div class="kpi-card red">
      <div class="kpi-label">Maior Categoria</div>
      <div class="kpi-value">${maxCat[0]}</div>
      <div class="kpi-sub">${fmt(maxCat[1])}</div>
    </div>
    <div class="kpi-card yellow">
      <div class="kpi-label">Média por Gasto</div>
      <div class="kpi-value">${fmt(avg)}</div>
      <div class="kpi-sub">por lançamento</div>
    </div>
  `;

  renderPieChart();
  renderLineChart();
  renderTable(expenses);
}

// ── Tabela ────────────────────────────────────────────────────────────────
function renderTable(data) {
  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
  const tbody  = document.getElementById('expense-tbody');

  tbody.innerHTML = sorted.slice(0, 20).map(e => `
    <tr>
      <td>
        <strong>${e.desc}</strong>
        ${e.obs ? `<br><small style="color:var(--muted)">${e.obs}</small>` : ''}
      </td>
      <td><span class="badge ${CATS[e.cat]?.cls || 'badge-outros'}">${e.cat}</span></td>
      <td style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent2)">${fmt(e.val)}</td>
      <td style="color:var(--muted)">${fmtDate(e.date)}</td>
      <td><button class="delete-btn" onclick="deleteExpense(${e.id})">✕</button></td>
    </tr>
  `).join('') || `
    <tr>
      <td colspan="5" style="text-align:center;color:var(--muted);padding:30px">
        Nenhum lançamento encontrado.
      </td>
    </tr>`;
}

function filterTable(query) {
  const q = query.toLowerCase();
  const filtered = q
    ? expenses.filter(e =>
        e.desc.toLowerCase().includes(q) ||
        e.cat.toLowerCase().includes(q))
    : expenses;
  renderTable(filtered);
}

// ── Adicionar / Deletar ───────────────────────────────────────────────────
function addExpense() {
  const desc = document.getElementById('descricao').value.trim();
  const val  = parseFloat(document.getElementById('valor').value);
  const date = document.getElementById('data').value;
  const cat  = document.getElementById('categoria').value;
  const pay  = document.getElementById('pagamento').value;
  const obs  = document.getElementById('observacoes').value.trim();

  if (!desc || !val || !date) {
    alert('Preencha Descrição, Valor e Data.');
    return;
  }

  expenses.push({ id: Date.now(), desc, val, date, cat, pay, obs });
  saveExpenses();

  document.getElementById('descricao').value  = '';
  document.getElementById('valor').value      = '';
  document.getElementById('observacoes').value = '';

  const toast = document.getElementById('toast');
  toast.style.display = 'block';
  setTimeout(() => (toast.style.display = 'none'), 2500);
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  renderDashboard();
}

// ── Gráficos ──────────────────────────────────────────────────────────────
function renderPieChart() {
  const catData = sumByCat(expenses);
  const cats    = Object.keys(catData);
  const vals    = cats.map(c => catData[c]);
  const colors  = cats.map(c => CATS[c]?.color || '#aaa');

  if (pieInstance) pieInstance.destroy();
  pieInstance = new Chart(document.getElementById('pieChart'), {
    type: 'doughnut',
    data: {
      labels: cats,
      datasets: [{ data: vals, backgroundColor: colors, borderWidth: 2, borderColor: '#131726', hoverOffset: 6 }],
    },
    options: {
      plugins: { legend: { labels: { color: '#e8ecf5', font: { family: 'DM Sans', size: 12 } } } },
      cutout: '62%',
    },
  });
}

function renderLineChart() {
  const months        = getLast6Months();
  const monthlyTotals = months.map(m =>
    expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.val, 0)
  );

  if (lineInstance) lineInstance.destroy();
  lineInstance = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: months.map(m => {
        const [y, mo] = m.split('-');
        return new Date(y, mo - 1).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      }),
      datasets: [{
        data: monthlyTotals,
        borderColor: '#5b8fff',
        backgroundColor: 'rgba(91,143,255,0.1)',
        tension: .4,
        pointBackgroundColor: '#5b8fff',
        fill: true,
        pointRadius: 4,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#232840' }, ticks: { color: '#6b7499' } },
        y: { grid: { color: '#232840' }, ticks: { color: '#6b7499', callback: v => 'R$ ' + v.toLocaleString('pt-BR') } },
      },
    },
  });
}

function renderBarChart() {
  const months        = getLast6Months();
  const monthlyTotals = months.map(m =>
    expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.val, 0)
  );

  if (barInstance) barInstance.destroy();
  barInstance = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: months.map(m => {
        const [y, mo] = m.split('-');
        return new Date(y, mo - 1).toLocaleString('pt-BR', { month: 'short' });
      }),
      datasets: [{
        data: monthlyTotals,
        backgroundColor: 'rgba(91,143,255,0.7)',
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#6b7499' } },
        y: { grid: { color: '#232840' }, ticks: { color: '#6b7499', callback: v => 'R$' + v } },
      },
    },
  });
}

// ── Relatórios ────────────────────────────────────────────────────────────
function buildMonthFilter() {
  const sel    = document.getElementById('mes-filtro');
  const months = [...new Set(expenses.map(e => e.date.slice(0, 7)))].sort().reverse();
  sel.innerHTML =
    '<option value="all">Todos</option>' +
    months.map(m => `<option value="${m}">${fmtMonth(m)}</option>`).join('');
}

function renderReports() {
  const sel  = document.getElementById('mes-filtro')?.value || 'all';
  const data = sel === 'all' ? expenses : expenses.filter(e => e.date.startsWith(sel));

  const catData = sumByCat(data);
  const total   = Object.values(catData).reduce((s, v) => s + v, 0) || 1;
  const sorted  = Object.entries(catData).sort((a, b) => b[1] - a[1]);

  document.querySelector('.cat-bars').innerHTML = sorted.map(([cat, val]) => `
    <div class="cat-row">
      <span class="cat-label">${cat}</span>
      <div class="cat-bar-wrap">
        <div class="cat-bar" style="width:${(val / total * 100).toFixed(1)}%;background:${CATS[cat]?.color || '#aaa'}"></div>
      </div>
      <span class="cat-value">${fmt(val)}</span>
    </div>
  `).join('') || '<p style="color:var(--muted);font-size:.85rem">Sem dados.</p>';

  renderBarChart();
}

// ── Exportar ──────────────────────────────────────────────────────────────
function handleExportCSV() {
  const header = ['Descrição', 'Categoria', 'Valor', 'Data', 'Pagamento', 'Observação'];
  const rows   = expenses.map(e => [e.desc, e.cat, e.val.toFixed(2), e.date, e.pay, e.obs]);
  const csv    = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a      = document.createElement('a');
  a.href       = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download   = 'gastos.csv';
  a.click();
}

function handleExportPDF() {
  const total    = expenses.reduce((s, e) => s + e.val, 0);
  const catData  = sumByCat(expenses);
  const expRows  = [...expenses].sort((a, b) => b.date.localeCompare(a.date))
    .map(e => `<tr><td>${e.desc}</td><td>${e.cat}</td><td>R$ ${e.val.toFixed(2)}</td><td>${fmtDate(e.date)}</td><td>${e.pay}</td></tr>`)
    .join('');
  const catRows  = Object.entries(catData).sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => `<tr><td>${cat}</td><td>R$ ${val.toFixed(2)}</td></tr>`)
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório</title>
  <style>body{font-family:Arial,sans-serif;margin:30px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f0f4ff}</style>
  </head><body>
  <h1>📊 Relatório de Gastos</h1>
  <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} — Total: <strong>R$ ${total.toFixed(2)}</strong></p>
  <h2>Por Categoria</h2><table><thead><tr><th>Categoria</th><th>Total</th></tr></thead><tbody>${catRows}</tbody></table>
  <h2>Lançamentos</h2><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th><th>Pagamento</th></tr></thead><tbody>${expRows}</tbody></table>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
}

// ── Expor funções globalmente (chamadas pelo HTML) ────────────────────────
window.showView       = showView;
window.addExpense     = addExpense;
window.deleteExpense  = deleteExpense;
window.filterTable    = filterTable;
window.renderReports  = renderReports;
window.handleExportCSV = handleExportCSV;
window.handleExportPDF = handleExportPDF;

// ── Init ──────────────────────────────────────────────────────────────────
expenses = loadExpenses();
document.getElementById('data').value = new Date().toISOString().split('T')[0];
renderDashboard();