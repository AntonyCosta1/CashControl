const SUPABASE_URL = 'https://gjquafybaidptzpgmbsq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F8jMtjU4DtQaD5Op2pcufg_6aZWHCf-';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const despesasAPI = {
  async listar() {
    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .order('data', { ascending: false });

    if (error) throw error;
    return data;
  },

  async criar(dados) {
    const { data, error } = await supabase
      .from('despesas')
      .insert([dados])
      .select();

    if (error) throw error;
    return data;
  },

  async deletar(id) {
    const { error } = await supabase
      .from('despesas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const investimentosAPI = {
  async listar() {
    const { data, error } = await supabase
      .from('investimentos')
      .select('*')
      .order('data', { ascending: false });

    if (error) throw error;
    return data;
  },

  async criar(dados) {
    const { data, error } = await supabase
      .from('investimentos')
      .insert([dados])
      .select();

    if (error) throw error;
    return data;
  },

  async deletar(id) {
    const { error } = await supabase
      .from('investimentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};