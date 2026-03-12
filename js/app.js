import { CATS, loadExpenses, saveExpenses, fmt, fmtDate, fmtMonth, sumByCat } from './data.js';
import { renderPieChart, renderLineChart, renderBarChart } from './charts.js';
import { exportCSV, exportPDF } from './export.js';

// ── State ─────────────────────────────────────────────────────────────────
let expenses = loadExpenses();

// ── Navigation ────────────────────────────────────────────────────────────
export function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  event.target.classList.add('active');

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

  renderPieChart(expenses);
  renderLineChart(expenses);
  renderTable(expenses);
}

// ── Table ─────────────────────────────────────────────────────────────────
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
      <td><button class="delete-btn" onclick="app.deleteExpense(${e.id})">✕</button></td>
    </tr>
  `).join('') || `
    <tr>
      <td colspan="5" style="text-align:center;color:var(--muted);padding:30px">
        Nenhum lançamento encontrado.
      </td>
    </tr>`;
}

export function filterTable(query) {
  const q        = query.toLowerCase();
  const filtered = q
    ? expenses.filter(e =>
        e.desc.toLowerCase().includes(q) ||
        e.cat.toLowerCase().includes(q))
    : expenses;
  renderTable(filtered);
}

// ── Add / Delete ──────────────────────────────────────────────────────────
export function addExpense() {
  const desc = document.getElementById('desc').value.trim();
  const val  = parseFloat(document.getElementById('valor').value);
  const date = document.getElementById('data').value;
  const cat  = document.getElementById('categoria').value;
  const pay  = document.getElementById('pagamento').value;
  const obs  = document.getElementById('obs').value.trim();

  if (!desc || !val || !date) {
    alert('Preencha Descrição, Valor e Data.');
    return;
  }

  expenses.push({ id: Date.now(), desc, val, date, cat, pay, obs });
  saveExpenses(expenses);

  document.getElementById('desc').value  = '';
  document.getElementById('valor').value = '';
  document.getElementById('obs').value   = '';

  const toast = document.getElementById('toast');
  toast.style.display = 'block';
  setTimeout(() => (toast.style.display = 'none'), 2500);
}

export function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses(expenses);
  renderDashboard();
}

// ── Reports ───────────────────────────────────────────────────────────────
function buildMonthFilter() {
  const sel    = document.getElementById('mes-filtro');
  const months = [...new Set(expenses.map(e => e.date.slice(0, 7)))]
    .sort()
    .reverse();
  sel.innerHTML =
    '<option value="all">Todos</option>' +
    months.map(m => `<option value="${m}">${fmtMonth(m)}</option>`).join('');
}

export function renderReports() {
  const sel  = document.getElementById('mes-filtro')?.value || 'all';
  const data = sel === 'all' ? expenses : expenses.filter(e => e.date.startsWith(sel));

  const catData = sumByCat(data);
  const total   = Object.values(catData).reduce((s, v) => s + v, 0) || 1;
  const sorted  = Object.entries(catData).sort((a, b) => b[1] - a[1]);

  document.getElementById('cat-bars').innerHTML = sorted.map(([cat, val]) => `
    <div class="cat-row">
      <span class="cat-label">${cat}</span>
      <div class="cat-bar-wrap">
        <div class="cat-bar" style="width:${(val / total * 100).toFixed(1)}%;background:${CATS[cat]?.color || '#aaa'}"></div>
      </div>
      <span class="cat-value">${fmt(val)}</span>
    </div>
  `).join('') || '<p style="color:var(--muted);font-size:.85rem">Sem dados.</p>';

  renderBarChart(expenses);
}

// ── Export wrappers ───────────────────────────────────────────────────────
export function handleExportCSV() { exportCSV(expenses); }
export function handleExportPDF() { exportPDF(expenses); }

// ── Init ──────────────────────────────────────────────────────────────────
document.getElementById('data').value = new Date().toISOString().split('T')[0];
renderDashboard();