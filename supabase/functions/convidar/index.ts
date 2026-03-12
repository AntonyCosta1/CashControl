// supabase/functions/convidar/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Cliente com permissões de admin (para buscar usuários por email)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Cliente do usuário logado (para pegar grupo_id via RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: 'Não autorizado.' }, 401);

  const { email_convidado } = await req.json();
  if (!email_convidado) return json({ error: 'E-mail obrigatório.' }, 400);

  // Pega grupo do usuário logado
  const { data: perfil } = await supabase
    .from('perfis')
    .select('grupo_id')
    .eq('id', user.id)
    .single();

  const grupo_id = perfil?.grupo_id;

  // Busca o convidado pelo email (requer service role)
  const { data: lista } = await supabaseAdmin.auth.admin.listUsers();
  const convidado = lista?.users?.find(u => u.email === email_convidado);

  if (!convidado) {
    return json({ error: 'Usuário não encontrado. Peça para ele se cadastrar primeiro.' }, 404);
  }

  // Verifica se já é membro
  const { data: jaMembro } = await supabaseAdmin
    .from('grupo_membros')
    .select('*')
    .eq('grupo_id', grupo_id)
    .eq('usuario_id', convidado.id)
    .single();

  if (jaMembro) return json({ error: 'Usuário já é membro do grupo.' }, 400);

  // Adiciona ao grupo
  await supabaseAdmin
    .from('grupo_membros')
    .insert({ grupo_id, usuario_id: convidado.id });

  // Atualiza perfil do convidado para o mesmo grupo
  await supabaseAdmin
    .from('perfis')
    .update({ grupo_id })
    .eq('id', convidado.id);

  return json({ mensagem: `${email_convidado} adicionado ao grupo com sucesso! 🎉` });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}