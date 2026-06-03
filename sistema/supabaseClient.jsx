/* supabaseClient.jsx — Cliente Supabase centralizado + CRUD seguro.
   ┌──────────────────────────────────────────────────────────────────┐
   │  🔒 SEGURANÇA: Apenas a anon_key (publishable) é usada aqui.  │
   │  A service_role_key NUNCA deve aparecer em código frontend.     │
   │  Operações privilegiadas passam por RPCs SECURITY DEFINER no    │
   │  banco (create_proposal, upsert_client).                        │
   └──────────────────────────────────────────────────────────────────┘ */

const SUPABASE_URL = 'https://qvyiziflnjbqstyoqcal.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_suN3ir3wjMCjhOPb4HY3rg_Jh9PnsbZ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── Sanitização (DOMPurify) ─────────────────────────────────────────
   Strip ALL HTML — campos de texto nunca devem conter tags.
   Defesa em profundidade: o banco também tem trigger anti-XSS. */
const sanitizeText = (v) => {
  if (typeof v !== 'string') return v;
  if (window.DOMPurify) return window.DOMPurify.sanitize(v, { ALLOWED_TAGS: [] });
  // Fallback se DOMPurify não carregou: strip tags manualmente
  return v.replace(/<[^>]*>/g, '');
};

/* Sanitiza recursivamente todos os campos string de um bloco de escopo. */
function sanitizeBlock(block) {
  if (!block || typeof block !== 'object') return block;
  const clean = Array.isArray(block) ? [] : {};
  for (const key of Object.keys(block)) {
    const val = block[key];
    if (typeof val === 'string') {
      clean[key] = sanitizeText(val);
    } else if (Array.isArray(val)) {
      clean[key] = val.map((item) =>
        typeof item === 'string' ? sanitizeText(item) :
        (typeof item === 'object' && item !== null) ? sanitizeBlock(item) : item
      );
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeBlock(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map(sanitizeBlock);
}

/* ── Perfil do usuário ───────────────────────────────────────────── */
async function sbGetProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) { console.error('sbGetProfile:', error); return null; }
  return data;
}

/* ── Propostas ───────────────────────────────────────────────────── */

/* Busca todas as propostas (JOIN com clients para exibir nome inline).
   RLS filtra automaticamente por tenant_id. */
async function sbFetchProposals() {
  const { data, error } = await supabase
    .from('proposals')
    .select(`
      *,
      client:clients (id, name, cnpj, origin, category)
    `)
    .order('created_at', { ascending: false });
  if (error) { console.error('sbFetchProposals:', error); return []; }
  return (data || []).map(mapProposalFromDB);
}

/* Cria proposta via RPC segura (server preenche tenant_id, created_by, proposal_code). */
async function sbCreateProposal({ clientId, status, isDraft, blocks, totalValue, paymentMethod, validityDate, origin }) {
  const { data, error } = await supabase.rpc('create_proposal', {
    p_client_id: clientId,
    p_status: status,
    p_is_draft: isDraft,
    p_scope_blocks: sanitizeBlocks(blocks),
    p_total_value: totalValue,
    p_payment_method: sanitizeText(paymentMethod),
    p_validity_date: validityDate,
    p_origin: origin,
  });
  if (error) { console.error('sbCreateProposal:', error); throw error; }
  return data;
}

/* Atualiza uma proposta existente (director pode alterar tudo;
   engineer é bloqueado pelo trigger enforce_engineer_update). */
async function sbUpdateProposal(id, patch) {
  const sanitized = { ...patch };
  if (sanitized.scope_blocks) sanitized.scope_blocks = sanitizeBlocks(sanitized.scope_blocks);
  if (sanitized.payment_method) sanitized.payment_method = sanitizeText(sanitized.payment_method);
  const { data, error } = await supabase
    .from('proposals')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();
  if (error) { console.error('sbUpdateProposal:', error); throw error; }
  return data;
}

/* Atualiza APENAS status e is_draft (seguro para engineer). */
async function sbUpdateStatus(id, status) {
  const isDraft = status === 'Rascunho';
  const { error } = await supabase
    .from('proposals')
    .update({ status, is_draft: isDraft })
    .eq('id', id);
  if (error) { console.error('sbUpdateStatus:', error); throw error; }
}

/* Exclui proposta (RLS garante que apenas director pode). */
async function sbDeleteProposal(id) {
  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id);
  if (error) { console.error('sbDeleteProposal:', error); throw error; }
}

/* ── Clientes ────────────────────────────────────────────────────── */

async function sbFetchClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  if (error) { console.error('sbFetchClients:', error); return []; }
  return data || [];
}

/* Busca clientes por nome (autocomplete, ILIKE). */
async function sbSearchClients(query) {
  if (!query || query.trim().length < 2) return [];
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', `%${query.trim()}%`)
    .limit(6);
  if (error) { console.error('sbSearchClients:', error); return []; }
  return data || [];
}

/* Upsert de cliente via RPC segura (server preenche tenant_id). */
async function sbUpsertClient({ name, cnpj, origin, category }) {
  const { data, error } = await supabase.rpc('upsert_client', {
    p_name: sanitizeText(name),
    p_cnpj: cnpj || null,
    p_origin: origin || null,
    p_category: category || null,
  });
  if (error) { console.error('sbUpsertClient:', error); throw error; }
  return data;
}

/* ── Mapper: DB row → formato dos componentes ────────────────────
   Os componentes existentes esperam campos como `cliente`, `cnpj`,
   `blocks`, `draft`, `valor`, `validade`, `data`, `origem`.
   O banco usa snake_case e relações. Este mapper faz a ponte. */
function mapProposalFromDB(row) {
  const client = row.client || {};
  return {
    // IDs
    id: row.proposal_code,
    _dbId: row.id,
    _clientId: row.client_id,
    // Dados do cliente (inline, como os componentes esperam)
    cliente: client.name || '',
    cnpj: client.cnpj || '',
    // Metadados da proposta
    status: row.status,
    draft: row.is_draft,
    data: row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : '',
    validade: row.validity_date || '',
    pagamento: row.payment_method || '',
    origem: row.origin || '',
    // Escopo
    blocks: row.scope_blocks || [],
    // Valor (fallback para cálculo do frontend)
    valor: Number(row.total_value) || 0,
    // Metadados internos
    _createdBy: row.created_by,
    _tenantId: row.tenant_id,
  };
}

/* ── Export to window ────────────────────────────────────────────── */
Object.assign(window, {
  supabase,
  sanitizeText, sanitizeBlocks,
  sbGetProfile,
  sbFetchProposals, sbCreateProposal, sbUpdateProposal, sbUpdateStatus, sbDeleteProposal,
  sbFetchClients, sbSearchClients, sbUpsertClient,
  mapProposalFromDB,
});
