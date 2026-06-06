/* Sistema de Propostas Profissionais — shared brand primitives + helpers.
   Reuses the LFA Engenharia design system tokens. Exports to window. */

const T = {
  deep: '#05070a', surface: '#12161E', s1: '#1A1A1A', s2: '#2A2A2A', s3: '#343434', s4: '#4B4B4B',
  gold: '#E1B14F', goldHover: '#c99d46', goldEnd: '#dd9b56', goldLink: '#C59436',
  fg1: '#FFFFFF', fg2: '#A0AAB5', fg3: '#6B7280',
};

// Lucide icon (+ inline brand glyphs Lucide dropped).
function Icon({ name, className = 'w-5 h-5', style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || !window.lucide) return;
    ref.current.innerHTML = '';
    const el = document.createElement('i');
    el.setAttribute('data-lucide', name);
    ref.current.appendChild(el);
    window.lucide.createIcons();
  }, [name]);
  return <span ref={ref} className={'inline-flex items-center justify-center ' + className} style={style}></span>;
}

const BRL = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const COMMISSION_RATE = 0.25; // 25% para leads de aquisição elegíveis

/* ── Origem do Lead & motor de comissões ───────────────────────────
   Cada proposta carrega uma origem. Origens de AQUISIÇÃO (canais de marketing
   e indicação do Rafael) geram 25% de comissão; origens ORGÂNICAS (prospecção
   do próprio Lucas / parceiros) não geram comissão. */
const LEAD_ORIGINS = {
  'Site LFA / Máquina de Leads':  { rate: 0.25, short: 'Site' },
  'Instagram LFA':                 { rate: 0.25, short: 'Instagram' },
  'Indicação — Rafael':            { rate: 0.25, short: 'Rafael' },
  'Prospecção Ativa — Lucas':      { rate: 0.00, short: 'Prospecção' },
  'Indicação — Lucas / Parceiros': { rate: 0.00, short: 'Parceiros' },
};
const LEAD_ORIGIN_KEYS = Object.keys(LEAD_ORIGINS);
const originInfo = (origem) => LEAD_ORIGINS[origem] || null;
const originRate = (origem) => (LEAD_ORIGINS[origem] ? LEAD_ORIGINS[origem].rate : 0);
const isEligible = (origem) => originRate(origem) > 0;
// Comissão de UMA proposta (já zera origens orgânicas).
const commissionFor = (p) => proposalTotal(p) * originRate(p && p.origem);
// Realizada: elegíveis com status Aprovado (e não-rascunho).
const commissionRealizada = (ps) => ps.filter((p) => !p.draft && p.status === 'Aprovado').reduce((a, p) => a + commissionFor(p), 0);
// Projetada: elegíveis em Enviado ou Em Negociação (não-rascunho).
const commissionProjetada = (ps) => ps.filter((p) => !p.draft && (p.status === 'Enviado' || p.status === 'Em Negociação')).reduce((a, p) => a + commissionFor(p), 0);

// Tag visual de origem: dourada p/ aquisição, neutra p/ orgânico.
function OriginTag({ origem, subtle }) {
  const info = originInfo(origem);
  const elig = info && info.rate > 0;
  if (elig) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
        style={{ color: T.gold, background: 'rgba(225,177,79,0.12)', border: '1px solid rgba(225,177,79,0.35)' }}>
        <Icon name="zap" className="w-3 h-3" /> Aquisição · {info.short}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ color: T.fg2, background: 'rgba(160,170,181,0.10)', border: '1px solid rgba(160,170,181,0.25)' }}>
      <Icon name="building-2" className="w-3 h-3" /> Orgânico LFA
    </span>
  );
}

/* ── Micro-CRM: clientes derivados das propostas ─────────────────────
   Agrupa por CNPJ/CPF (fallback nome). LTV = soma das propostas "Aprovado".
   Última interação = data da proposta mais recente do cliente. */
function clientKey(p) { return onlyDigits(p.cnpj) || String(p.cliente || '').trim().toLowerCase(); }
function deriveClients(proposals) {
  const map = new Map();
  proposals.forEach((p) => {
    const k = clientKey(p);
    if (!k) return;
    if (!map.has(k)) map.set(k, { key: k, id: p._clientId, nome: p.cliente, cnpj: p.cnpj, items: [] });
    map.get(k).items.push(p);
  });
  return Array.from(map.values()).map((c) => {
    const ltv = c.items.filter((p) => !p.draft && p.status === 'Aprovado').reduce((a, p) => a + proposalTotal(p), 0);
    const pipeline = c.items.filter((p) => !p.draft).reduce((a, p) => a + proposalTotal(p), 0);
    return { ...c, ltv, pipeline, ultima: c.items[0] ? c.items[0].data : '', origem: c.items[0] ? c.items[0].origem : '', count: c.items.length };
  });
}

// Parse a pt-BR money string ("48.500,00") into a Number.
const parseBRL = (v) => Number(String(v ?? '').replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0;

/* ── Documento do cliente (CPF / CNPJ) ──────────────────────────────────
   Máscara automática: detecta CPF (até 11 dígitos) ou CNPJ (12–14) pela
   quantidade de números digitados e formata progressivamente. */
const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');
const cpfCnpjLabel = (v) => (onlyDigits(v).length > 11 ? 'CNPJ' : 'CPF');
function maskCpfCnpj(value) {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 11) { // CPF: XXX.XXX.XXX-XX
    let r = d.slice(0, 3);
    if (d.length > 3) r += '.' + d.slice(3, 6);
    if (d.length > 6) r += '.' + d.slice(6, 9);
    if (d.length > 9) r += '-' + d.slice(9, 11);
    return r;
  }
  // CNPJ: XX.XXX.XXX/XXXX-XX
  let r = d.slice(0, 2) + '.' + d.slice(2, 5);
  if (d.length > 5) r += '.' + d.slice(5, 8);
  if (d.length > 8) r += '/' + d.slice(8, 12);
  if (d.length > 12) r += '-' + d.slice(12, 14);
  return r;
}

/* ── Moeda (BRL) ────────────────────────────────────────────────────────
   Máscara de centavos: só dígitos, preenche da direita p/ esquerda.
   Ex.: "500000" → "5.000,00". Sem o "R$" (o campo já tem o prefixo). */
function maskMoeda(value) {
  const d = onlyDigits(value);
  if (!d) return '';
  return (parseInt(d, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── Quantidade (numérico) ──────────────────────────────────────────
   Coluna de quantidade: aceita apenas dígitos e UMA vírgula decimal.
   Bloqueia texto para não quebrar a conta valor × quantidade. */
function maskQtd(value) {
  let d = String(value ?? '').replace(/[^\d,]/g, '');
  const i = d.indexOf(',');
  if (i !== -1) d = d.slice(0, i + 1) + d.slice(i + 1).replace(/,/g, '');
  return d;
}

/* ── Datas ──────────────────────────────────────────────────────────── */
const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const isoToDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? '')); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const dateToISO = (d) => { const z = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); };
const futureISO = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return dateToISO(d); };
// Formatação para exibição — passa texto legado (não-ISO) sem alterar.
const fmtDateBR = (iso) => { const p = isoToDate(iso); if (!p) return String(iso ?? ''); const z = (n) => String(n).padStart(2, '0'); return z(p.getDate()) + '/' + z(p.getMonth() + 1) + '/' + p.getFullYear(); };
const fmtDateLong = (iso) => { const p = isoToDate(iso); if (!p) return String(iso ?? ''); return p.getDate() + ' de ' + MESES_PT[p.getMonth()] + ' de ' + p.getFullYear(); };
// Gatilho de urgência: data ISO de validade anterior a hoje (texto legado → false).
const isExpired = (iso) => { const p = isoToDate(iso); if (!p) return false; const t = new Date(); t.setHours(0, 0, 0, 0); return p.getTime() < t.getTime(); };

// Status model — each with a tone for the badge.
const STATUSES = {
  'Rascunho':      { dot: '#8A93A0', fg: '#A0AAB5', bg: 'rgba(138,147,160,0.10)', bd: 'rgba(138,147,160,0.3)' },
  'Enviado':       { dot: '#A0AAB5', fg: '#A0AAB5', bg: 'rgba(160,170,181,0.12)', bd: 'rgba(160,170,181,0.3)' },
  'Em Negociação': { dot: '#E1B14F', fg: '#E1B14F', bg: 'rgba(225,177,79,0.12)',  bd: 'rgba(225,177,79,0.35)' },
  'Aprovado':      { dot: '#3DBA7E', fg: '#3DBA7E', bg: 'rgba(61,186,126,0.12)',  bd: 'rgba(61,186,126,0.35)' },
  'Perdido':       { dot: '#f87171', fg: '#f87171', bg: 'rgba(248,113,113,0.12)', bd: 'rgba(248,113,113,0.35)' },
};
// Status comerciais (exclui Rascunho) — usáveis no dropdown de propostas emitidas.
const STATUS_KEYS = ['Enviado', 'Em Negociação', 'Aprovado', 'Perdido'];

function StatusBadge({ status, theme }) {
  const s = STATUSES[status] || STATUSES['Enviado'];
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color: s.fg, background: s.bg, border: `1px solid ${s.bd}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }}></span>{status}
    </span>
  );
}

/* ── Block model ─────────────────────────────────────────────────────────
   A proposal's scope is an ordered list of typed blocks — a contract builder.
   Only `item` blocks carry money and sum into the investment total. */
const BLOCK_TYPES = {
  item:     { label: 'Item de escopo', icon: 'list-checks',    hint: 'Serviço com valor — soma ao investimento' },
  tabela:   { label: 'Tabela',          icon: 'table-2',        hint: 'Materiais ou itens — marque uma coluna como valor' },
  clausula: { label: 'Cláusula',        icon: 'scale',          hint: 'Termo contratual em destaque' },
  etapas:   { label: 'Cronograma',      icon: 'calendar-clock', hint: 'Fases e prazos de execução' },
  nota:     { label: 'Nota técnica',    icon: 'info',           hint: 'Observação em callout' },
  exclusao: { label: 'Não incluso',     icon: 'circle-slash',   hint: 'O que está fora do escopo' },
  texto:    { label: 'Texto / Seção',   icon: 'pilcrow',        hint: 'Parágrafo livre com subtítulo' },
};
const BLOCK_ORDER = ['item', 'tabela', 'clausula', 'etapas', 'nota', 'exclusao', 'texto'];

let __bseq = 0;
const blockId = () => 'b' + (Date.now().toString(36)) + (__bseq++).toString(36);

function newBlock(type) {
  const id = blockId();
  switch (type) {
    case 'item':     return { id, type, titulo: '', detalhe: '', valor: '' };
    case 'tabela':   return { id, type, titulo: '', colunas: ['Descrição', 'Qtd.', 'Valor unit.'], linhas: [['', '', ''], ['', '', '']], valorCol: null, qtdCol: null };
    case 'clausula': return { id, type, titulo: '', texto: '' };
    case 'etapas':   return { id, type, titulo: 'Cronograma de execução', fases: [{ nome: '', prazo: '' }, { nome: '', prazo: '' }] };
    case 'nota':     return { id, type, texto: '' };
    case 'exclusao': return { id, type, titulo: 'Não está incluso', itens: ['', ''] };
    case 'texto':    return { id, type, titulo: '', corpo: '' };
    default:         return { id, type: 'texto', titulo: '', corpo: '' };
  }
}

// Quanto um bloco soma ao investimento.
//  · item  → o valor do item;
//  · tabela → soma da coluna de valor; se houver coluna de quantidade,
//            cada linha conta como valor × quantidade;
//  · demais → nada.
function blockMoney(b) {
  if (!b) return 0;
  if (b.type === 'item') return parseBRL(b.valor);
  if (b.type === 'tabela' && b.valorCol != null) {
    const vc = b.valorCol, qc = (b.qtdCol != null) ? b.qtdCol : null;
    return (b.linhas || []).reduce((a, row) => {
      const val = parseBRL(row[vc]);
      const qty = qc != null ? parseBRL(row[qc]) : 1;
      return a + val * qty;
    }, 0);
  }
  return 0;
}

// Investment total = soma de todo bloco que carrega valor (fallback: legacy p.valor).
function proposalTotal(p) {
  if (Array.isArray(p.blocks) && p.blocks.length) {
    const hasMoney = p.blocks.some((b) => b.type === 'item' || (b.type === 'tabela' && b.valorCol != null));
    if (hasMoney) return p.blocks.reduce((a, b) => a + blockMoney(b), 0);
  }
  return Number(p.valor) || 0;
}

/* Opções de pagamento (usadas no Composer). */
const PAYMENT_OPTIONS = [
  '50% entrada + 50% em 30 dias',
  'À vista (PIX) com 5% de desconto',
  'Parcelado em 3x sem juros',
];
const PAYMENT_CUSTOM = 'Personalizado (Texto Livre)';

Object.assign(window, {
  T, Icon, BRL, COMMISSION_RATE, parseBRL, STATUSES, STATUS_KEYS, StatusBadge,
  LEAD_ORIGINS, LEAD_ORIGIN_KEYS, originInfo, originRate, isEligible, OriginTag,
  commissionFor, commissionRealizada, commissionProjetada, clientKey, deriveClients,
  BLOCK_TYPES, BLOCK_ORDER, newBlock, blockMoney, proposalTotal,
  PAYMENT_OPTIONS, PAYMENT_CUSTOM,
  onlyDigits, cpfCnpjLabel, maskCpfCnpj, maskMoeda, maskQtd, MESES_PT, isoToDate, dateToISO, futureISO, fmtDateBR, fmtDateLong, isExpired,
});
