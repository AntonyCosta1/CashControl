import { CATS, sumByCat, getLast6Months } from './data.js';

let pieInstance  = null;
let lineInstance = null;
let barInstance  = null;

// ── Dashboard charts ──────────────────────────────────────────────────────
export function renderPieChart(expenses) {
  const catData = sumByCat(expenses);
  const cats    = Object.keys(catData);
  const vals    = cats.map(c => catData[c]);
  const colors  = cats.map(c => CATS[c]?.color || '#aaa');

  if (pieInstance) pieInstance.destroy();

  pieInstance = new Chart(document.getElementById('pieChart'), {
    type: 'doughnut',
    data: {
      labels: cats,
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
          labels: { color: '#e8ecf5', font: { family: 'DM Sans', size: 12 } },
        },
      },
      cutout: '62%',
      animation: { animateRotate: true },
    },
  });
}

export function renderLineChart(expenses) {
  const months       = getLast6Months();
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
        x: { grid: { color: '#232840' }, ticks: { color: '#6b7499', font: { family: 'DM Sans' } } },
        y: {
          grid: { color: '#232840' },
          ticks: {
            color: '#6b7499',
            font: { family: 'DM Sans' },
            callback: v => 'R$ ' + v.toLocaleString('pt-BR'),
          },
        },
      },
      animation: { duration: 700 },
    },
  });
}

// ── Reports bar chart ─────────────────────────────────────────────────────
export function renderBarChart(expenses) {
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
        y: {
          grid: { color: '#232840' },
          ticks: { color: '#6b7499', callback: v => 'R$' + v },
        },
      },
    },
  });
}