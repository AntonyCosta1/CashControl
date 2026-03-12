// supabase/functions/investimentos/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: 'Não autorizado.' }, 401);

  const { data: perfil } = await supabase
    .from('perfis')
    .select('grupo_id')
    .eq('id', user.id)
    .single();

  const grupo_id = perfil?.grupo_id;
  const url      = new URL(req.url);
  const id       = url.searchParams.get('id');
  const resumo   = url.searchParams.get('resumo');

  // ── GET resumo ─────────────────────────────────────
  if (req.method === 'GET' && resumo) {
    const { data, error } = await supabase
      .from('investimentos')
      .select('investido, atual, tipo')
      .eq('grupo_id', grupo_id);

    if (error) return json({ error: error.message }, 500);

    const totalInvestido = data.reduce((s, i) => s + Number(i.investido), 0);
    const totalAtual     = data.reduce((s, i) => s + Number(i.atual ?? i.investido), 0);
    const lucro          = totalAtual - totalInvestido;
    const rentPct        = totalInvestido > 0 ? (lucro / totalInvestido) * 100 : 0;

    // Agrupa por tipo
    const porTipo = data.reduce((acc: Record<string, number>, i) => {
      acc[i.tipo] = (acc[i.tipo] || 0) + Number(i.atual ?? i.investido);
      return acc;
    }, {});

    return json({ totalInvestido, totalAtual, lucro, rentPct, porTipo, qtdAtivos: data.length });
  }

  // ── GET lista ──────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('investimentos')
      .select('*, perfis(nome)')
      .eq('grupo_id', grupo_id)
      .order('data', { ascending: false });

    if (error) return json({ error: error.message }, 500);
    return json(data);
  }

  // ── POST ───────────────────────────────────────────
  if (req.method === 'POST') {
    const body = await req.json();
    const { data, error } = await supabase
      .from('investimentos')
      .insert({
        ...body,
        grupo_id,
        usuario_id: user.id,
        atual: body.atual ?? body.investido,
      })
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);
    return json(data, 201);
  }

  // ── PATCH ──────────────────────────────────────────
  if (req.method === 'PATCH' && id) {
    const body = await req.json();
    const { data, error } = await supabase
      .from('investimentos')
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
      .from('investimentos')
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