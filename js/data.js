// ── Categoria config ──────────────────────────────────────────────────────
export const CATS = {
  'Alimentação': { color: '#5b8fff', cls: 'badge-alimentacao' },
  'Transporte':  { color: '#43e5b0', cls: 'badge-transporte'  },
  'Lazer':       { color: '#f9c74f', cls: 'badge-lazer'       },
  'Saúde':       { color: '#ff6b6b', cls: 'badge-saude'       },
  'Moradia':     { color: '#c77dff', cls: 'badge-moradia'     },
  'Outros':      { color: '#aaaaaa', cls: 'badge-outros'      },
};

// ── Seed data ─────────────────────────────────────────────────────────────
export const SEED = [
  { id: 1,  desc: 'Supermercado', cat: 'Alimentação', val: 320.50, date: '2026-02-05', pay: 'Débito',  obs: '' },
  { id: 2,  desc: 'Uber',         cat: 'Transporte',  val: 45.00,  date: '2026-02-08', pay: 'Pix',     obs: '' },
  { id: 3,  desc: 'Netflix',      cat: 'Lazer',       val: 39.90,  date: '2026-02-10', pay: 'Crédito', obs: '' },
  { id: 4,  desc: 'Farmácia',     cat: 'Saúde',       val: 85.00,  date: '2026-02-15', pay: 'Débito',  obs: '' },
  { id: 5,  desc: 'Aluguel',      cat: 'Moradia',     val: 1200.0, date: '2026-02-01', pay: 'Pix',     obs: '' },
  { id: 6,  desc: 'Restaurante',  cat: 'Alimentação', val: 95.00,  date: '2026-03-02', pay: 'Crédito', obs: '' },
  { id: 7,  desc: 'Gasolina',     cat: 'Transporte',  val: 160.00, date: '2026-03-04', pay: 'Débito',  obs: '' },
  { id: 8,  desc: 'Aluguel',      cat: 'Moradia',     val: 1200.0, date: '2026-03-01', pay: 'Pix',     obs: '' },
  { id: 9,  desc: 'Streaming',    cat: 'Lazer',       val: 55.90,  date: '2026-03-10', pay: 'Crédito', obs: '' },
  { id: 10, desc: 'Academia',     cat: 'Saúde',       val: 99.00,  date: '2026-03-05', pay: 'Crédito', obs: '' },
];

// ── Storage helpers ───────────────────────────────────────────────────────
export function loadExpenses() {
  const stored = localStorage.getItem('expenses');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('expenses', JSON.stringify(SEED));
  return [...SEED];
}

export function saveExpenses(expenses) {
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

// ── Formatting helpers ────────────────────────────────────────────────────
export function fmt(v) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function fmtMonth(m) {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

// ── Aggregation helpers ───────────────────────────────────────────────────
export function sumByCat(data) {
  return data.reduce((acc, e) => {
    acc[e.cat] = (acc[e.cat] || 0) + e.val;
    return acc;
  }, {});
}

export function getLast6Months() {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}