import { sumByCat, fmtDate } from './data.js';

// ── CSV export ────────────────────────────────────────────────────────────
export function exportCSV(expenses) {
  const header = ['Descrição', 'Categoria', 'Valor', 'Data', 'Pagamento', 'Observação'];
  const rows   = expenses.map(e => [e.desc, e.cat, e.val.toFixed(2), e.date, e.pay, e.obs]);
  const csv    = [header, ...rows]
    .map(r => r.map(c => `"${c}"`).join(','))
    .join('\n');

  triggerDownload('gastos.csv', 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv));
}

// ── PDF / print export ────────────────────────────────────────────────────
export function exportPDF(expenses) {
  const total   = expenses.reduce((s, e) => s + e.val, 0);
  const catData = sumByCat(expenses);

  const expenseRows = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(e => `
      <tr>
        <td>${e.desc}</td>
        <td>${e.cat}</td>
        <td>R$ ${e.val.toFixed(2)}</td>
        <td>${fmtDate(e.date)}</td>
        <td>${e.pay}</td>
      </tr>`)
    .join('');

  const catRows = Object.entries(catData)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => `<tr><td>${cat}</td><td>R$ ${val.toFixed(2)}</td></tr>`)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Gastos</title>
      <style>
        body  { font-family: Arial, sans-serif; margin: 30px; color: #111; }
        h1    { color: #1a1f30; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td{ border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th    { background: #f0f4ff; }
        .total{ font-size: 1.2rem; margin: 12px 0; }
      </style>
    </head>
    <body>
      <h1>📊 Relatório de Gastos</h1>
      <p>Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
      <p class="total">Total geral: <strong>R$ ${total.toFixed(2)}</strong></p>

      <h2>Por Categoria</h2>
      <table>
        <thead><tr><th>Categoria</th><th>Total</th></tr></thead>
        <tbody>${catRows}</tbody>
      </table>

      <h2>Lançamentos</h2>
      <table>
        <thead>
          <tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th><th>Pagamento</th></tr>
        </thead>
        <tbody>${expenseRows}</tbody>
      </table>
    </body>
    </html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  setTimeout(() => win.print(), 600);
}

// ── Internal helper ───────────────────────────────────────────────────────
function triggerDownload(filename, href) {
  const a    = document.createElement('a');
  a.href     = href;
  a.download = filename;
  a.click();
}