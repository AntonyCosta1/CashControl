// supabase/functions/despesas/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Cliente com token do usuário (respeita RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  // Usuário autenticado
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return json({ error: 'Não autorizado.' }, 401);
  }

  // grupo_id do usuário
  const { data: perfil } = await supabase
    .from('perfis')
    .select('grupo_id')
    .eq('id', user.id)
    .single();

  const grupo_id = perfil?.grupo_id;
  const url      = new URL(req.url);
  const id       = url.searchParams.get('id');
  const mes      = url.searchParams.get('mes'); // formato: "2026-03"

  // ── GET ────────────────────────────────────────────
  if (req.method === 'GET') {
    let query = supabase
      .from('despesas')
      .select('*, perfis(nome)')
      .eq('grupo_id', grupo_id)
      .order('data', { ascending: false });

    if (mes) {
      // filtra pelo mês: ex "2026-03" → entre 2026-03-01 e 2026-03-31
      const [ano, m] = mes.split('-');
      const inicio   = `${ano}-${m}-01`;
      const fim      = new Date(Number(ano), Number(m), 0).toISOString().split('T')[0];
      query = query.gte('data', inicio).lte('data', fim);
    }

    const { data, error } = await query.limit(500);
    if (error) return json({ error: error.message }, 500);
    return json(data);
  }

  // ── POST ───────────────────────────────────────────
  if (req.method === 'POST') {
    const body = await req.json();
    const { data, error } = await supabase
      .from('despesas')
      .insert({ ...body, grupo_id, usuario_id: user.id })
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);
    return json(data, 201);
  }

  // ── PATCH ──────────────────────────────────────────
  if (req.method === 'PATCH' && id) {
    const body = await req.json();
    const { data, error } = await supabase
      .from('despesas')
      .update(body)
      .eq('id', id)
      .eq('grupo_id', grupo_id)
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);
    return json(data);
  }

  // ── DELETE ─────────────────────────────────────────
  if (req.method === 'DELETE' && id) {
    const { error } = await supabase
      .from('despesas')
      .delete()
      .eq('id', id)
      .eq('grupo_id', grupo_id);
    if (error) return json({ error: error.message }, 400);
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return json({ error: 'Rota não encontrada.' }, 404);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}