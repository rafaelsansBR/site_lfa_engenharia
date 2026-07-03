/* Interface 3 — O Documento da Proposta (PAGINADO).
   Render cinematográfico do documento, montado a partir dos blocos e
   distribuído em FOLHAS A4 REAIS. Arquitetura da "trava":
     · cada peça do documento é uma UNIDADE ATÔMICA;
     · o renderizador mede a altura real de cada unidade;
     · empacota greedily em páginas de altura A4 — uma unidade NUNCA é
       cortada ao meio; se não cabe, vai inteira para a próxima folha;
     · "keep-with-next" cola títulos de seção à 1ª linha (controle de órfãs).
   Tematizável (dark / light / papel), variantes de layout e gridline.
   Pronto para impressão / PDF multipáginas. */

/* ── geometria A4 (96 dpi: 210×297mm ≈ 794×1123px) ───────────────── */
const PAGE_W = 794, PAGE_H = 1123;
const PAD_X = 56, HEADER_ZONE = 88, FOOTER_ZONE = 64;
const CONTENT_W = PAGE_W - PAD_X * 2;            // 682
const CONTENT_H = PAGE_H - HEADER_ZONE - FOOTER_ZONE; // 971
const UNIT_GAP = 24;   // ritmo vertical (fallback)
const PAGE_GAP = 30;   // espaço entre folhas (apenas na tela)

/* ── escala de espaçamento vertical (ritmo único do documento) ─────
   Em vez de um gap uniforme entre tudo, cada unidade carrega o espaço
   que deve aparecer ACIMA dela conforme seu papel semântico:
     · title   → entre um título/eyebrow e o conteúdo que ele rotula (apertado)
     · stack   → entre itens irmãos de uma mesma lista
     · block   → entre blocos independentes / parágrafo→bloco
     · section → respiro maior antes de um novo título de seção
   Assim "título→bloco", "título→tabela", "parágrafo→título" ficam
   todos consistentes em todo o documento. */
const SP = { title: 14, stack: 14, block: 22, section: 36, hero: 28 };

function buildDocTheme(themeName, accentName, gridName) {
  const accents = {
    gold:   { a: '#E1B14F', rgb: '225,177,79' },
    bronze: { a: '#B07D3F', rgb: '176,125,63' },
    petrol: { a: '#3E7480', rgb: '62,116,128' },
  };
  const ac = accents[accentName] || accents.gold;
  const themes = {
    dark:  { sheet: 'linear-gradient(180deg,#0b0e14,#05070a)', fg: '#FFFFFF', fg2: '#A0AAB5', fg3: '#6B7280', line: 'rgba(255,255,255,0.08)', soft: 'rgba(255,255,255,0.03)', gridBase: 0.025, isLight: false },
    light: { sheet: '#FFFFFF', fg: '#14181F', fg2: '#525C68', fg3: '#8A93A0', line: 'rgba(20,24,32,0.12)', soft: 'rgba(20,24,32,0.025)', gridBase: 0.045, isLight: true },
    paper: { sheet: '#F7F2E7', fg: '#2A2520', fg2: '#5E564B', fg3: '#9C8F7B', line: 'rgba(42,37,32,0.15)', soft: 'rgba(42,37,32,0.035)', gridBase: 0.05, isLight: true },
  };
  const th = themes[themeName] || themes.dark;
  const gf = ({ off: 0, subtle: 1, visible: 2 })[gridName] ?? 1;
  const ga = th.gridBase * gf;
  const gridColor = th.isLight ? `rgba(20,24,32,${ga})` : `rgba(255,255,255,${ga})`;
  return { ...th, accent: ac.a, aRGB: ac.rgb, grid: gridColor, a: (o) => `rgba(${ac.rgb},${o})` };
}

const Eyebrow = ({ children, d, accent }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent ? d.accent : d.fg3, marginBottom: SP.title }}>{children}</div>
);

/* ── block renderers (sem margem própria — o ritmo vem do flow-stack) ─ */
function ItemRow({ b, d }) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-xl px-5 py-4" style={{ border: `1px solid ${d.line}`, background: d.soft }}>
      <div>
        <div className="font-medium text-sm" style={{ color: d.fg }}>{b.titulo || 'Item de escopo'}</div>
        {b.detalhe && <div className="text-xs mt-1 leading-relaxed max-w-[480px]" style={{ color: d.fg2 }}>{b.detalhe}</div>}
      </div>
      <div className="font-semibold whitespace-nowrap" style={{ color: d.fg }}><span>{BRL(b.valor)}</span></div>
    </div>
  );
}

function TabelaView({ b, d }) {
  const vc = b.valorCol ?? null;
  const qc = b.qtdCol ?? null;
  const subtotal = blockMoney(b);
  return (
    <div>
      {b.titulo && <Eyebrow d={d} accent>{b.titulo}</Eyebrow>}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${d.line}` }}>
        <div className="flex" style={{ background: d.soft }}>
          {b.colunas.map((c, i) => (
            <div key={i} className="flex-1 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: i === vc ? d.accent : d.fg3, textAlign: (i === vc || i === qc) ? 'right' : 'left', borderLeft: i ? `1px solid ${d.line}` : 'none' }}>{c}</div>
          ))}
        </div>
        {b.linhas.map((row, r) => (
          <div key={r} className="flex" style={{ borderTop: `1px solid ${d.line}` }}>
            {row.map((cell, c) => (
              <div key={c} className="flex-1 px-4 py-2.5 text-sm tabular-nums" style={{ color: c === vc ? d.fg : (c === 0 ? d.fg : d.fg2), fontWeight: c === vc ? 600 : 400, textAlign: (c === vc || c === qc) ? 'right' : 'left', borderLeft: c ? `1px solid ${d.line}` : 'none' }}>{c === vc ? (String(cell).trim() ? BRL(parseBRL(cell)) : '—') : (cell || '—')}</div>
            ))}
          </div>
        ))}
        {vc != null && (
          <div className="flex items-center justify-between" style={{ borderTop: `1px solid ${d.a(0.3)}`, background: d.a(0.05) }}>
            <span className="px-4 text-[11px] font-semibold uppercase tracking-wider inline-flex items-center" style={{ height: 38, lineHeight: 1, color: d.fg2 }}>Subtotal</span>
            <span className="px-4 text-sm font-bold tabular-nums inline-flex items-center justify-center" style={{ height: 38, lineHeight: 1, color: d.accent }}>{BRL(subtotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ClausulaView({ b, d, n }) {
  return (
    <div className="rounded-xl p-5" style={{ background: d.a(0.06), border: `1px solid ${d.a(0.28)}`, borderLeft: `3px solid ${d.accent}` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="scale" className="w-3.5 h-3.5 shrink-0" style={{ color: d.accent }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: d.accent, lineHeight: 1 }}><span>{n ? n + '. ' : ''}{b.titulo || 'Cláusula'}</span></span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: d.fg2 }}>{b.texto}</p>
    </div>
  );
}

function EtapasView({ b, d }) {
  return (
    <div>
      {b.titulo && <Eyebrow d={d} accent>{b.titulo}</Eyebrow>}
      <div className="flex flex-col">
        {b.fases.map((f, i) => (
          <div key={i} className="flex items-center gap-3.5 py-3" style={{ borderTop: i ? `1px solid ${d.line}` : 'none' }}>
            <span className="shrink-0 rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: d.a(0.14) }}><span className="text-xs font-bold" style={{ lineHeight: 1, color: d.accent }}>{i + 1}</span></span>
            <span className="text-sm flex-1" style={{ color: d.fg, lineHeight: 1.1 }}><span>{f.nome || '—'}</span></span>
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: d.fg2, lineHeight: 1.1 }}><span>{f.prazo}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotaView({ b, d }) {
  return (
    <div className="rounded-xl p-4 flex gap-3" style={{ background: d.soft, border: `1px solid ${d.line}` }}>
      <span className="shrink-0 inline-flex" style={{ height: '1.45em', alignItems: 'center' }}><Icon name="info" className="w-4 h-4" style={{ color: d.accent }} /></span>
      <p className="text-sm leading-relaxed" style={{ color: d.fg2 }}><span>{b.texto}</span></p>
    </div>
  );
}

function ExclusaoView({ b, d }) {
  return (
    <div>
      {b.titulo && <Eyebrow d={d}>{b.titulo}</Eyebrow>}
      <div className="flex flex-col gap-2">
        {b.itens.filter((x) => x.trim()).map((it, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Icon name="circle-slash" className="w-3.5 h-3.5 shrink-0" style={{ color: d.fg3 }} />
            <span className="text-sm" style={{ color: d.fg2, lineHeight: 1.1 }}><span>{it}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextoView({ b, d }) {
  return (
    <div>
      {b.titulo && <Eyebrow d={d} accent>{b.titulo}</Eyebrow>}
      <p className="text-sm leading-relaxed" style={{ color: d.fg2 }}>{b.corpo}</p>
    </div>
  );
}

function Brandmark({ d, size = 52 }) {
  // Logo horizontal COMPLETO (monograma + texto), em PNG de alta resolução
  // — o html2canvas redimensiona mal <img> de SVG com viewBox, então o PNG
  // garante render correto no PDF. Principal em fundo claro; negativo no escuro.
  const src = d.isLight
    ? 'assets/lfa-logo-horizontal-principal.png'
    : 'assets/lfa-logo-horizontal-negativo.png';
  return <img src={src} alt="LFA Engenharia" style={{ height: size * 1.08, width: 'auto', display: 'block' }} />;
}

function InvestmentBar({ total, d }) {
  // Padrão "badge": cada texto vive num box inline-flex de ALTURA EXPLÍCITA
  // centralizado — único arranjo que o html2canvas centraliza com <0,5px no
  // raster (PDF). Não usar flex-item solto: o html2canvas erra a baseline.
  const H = 40;
  return (
    <div className="flex items-center justify-between px-5 rounded-xl" style={{ paddingTop: 12, paddingBottom: 12, border: `1px solid ${d.a(0.3)}`, background: d.a(0.05) }}>
      <span className="font-[Outfit] font-bold inline-flex items-center justify-center" style={{ height: H, lineHeight: 1, color: d.fg }}>Investimento Total</span>
      <span className="font-[Outfit] font-bold text-2xl inline-flex items-center justify-center" style={{ height: H, lineHeight: 1, color: d.accent }}>{BRL(total)}</span>
    </div>
  );
}

function Conditions({ p, d }) {
  const items = [
    { i: 'credit-card', t: 'Forma de Pagamento', v: p.pagamento },
    { i: 'calendar-clock', t: 'Validade', v: fmtDateLong(p.validade) || '15 dias corridos da emissão' },
    { i: 'shield-check', t: 'Conformidade', v: 'CREA-SP · NR-10 · NBR 5410' },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((c) => (
        <div key={c.t} className="rounded-xl p-4" style={{ background: d.soft, border: `1px solid ${d.line}` }}>
          <Icon name={c.i} className="w-4 h-4 mb-2" style={{ color: d.accent }} />
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: d.fg3 }}>{c.t}</div>
          <div className="text-sm" style={{ color: d.fg }}>{c.v}</div>
        </div>
      ))}
    </div>
  );
}

function Signature({ d }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 pt-7" style={{ borderTop: `1px solid ${d.line}` }}>
      <div>
        <div className="font-[Outfit] font-bold text-sm" style={{ color: d.fg }}>Lucas Feitosa Araujo</div>
        <div className="text-xs" style={{ color: d.fg2 }}>Engenheiro Eletricista · Diretor Técnico</div>
        <div className="text-xs" style={{ color: d.fg3 }}>CREA-SP · Mackenzie / PUC</div>
      </div>
      <div className="text-right text-xs leading-relaxed" style={{ color: d.fg3 }}>
        <div>LFA Engenharia · CNPJ: 65.701.869/0001-09</div>
        <div>
          <a href="tel:+5511950727235" className="hover:underline" style={{ color: d.fg3 }}>11 95072-7235</a>
          <span> · </span>
          <a href="mailto:contato@lfaengenharia.com" className="hover:underline" style={{ color: d.fg3 }}>contato@lfaengenharia.com</a>
        </div>
        <a href="https://lfaengenharia.com" target="_blank" rel="noopener" className="block hover:underline" style={{ color: d.accent }}>www.lfaengenharia.com</a>
      </div>
    </div>
  );
}

const INTRO = 'Apresentamos a proposta técnica para o serviço descrito abaixo. Nosso compromisso é blindar o seu ativo contra riscos e paradas, entregando conformidade normativa e continuidade operacional — com o rigor de engenharia que a sua operação exige.';

/* ── HERO (capa do documento) — layout fixo, espelha o PDF gerado ── */
function HeroBrand({ p, d }) {
  // clássico: marca à esquerda, identificação da proposta à direita
  return (
    <div className="flex items-start justify-between gap-6 pb-7" style={{ borderBottom: `1px solid ${d.a(0.25)}` }}>
      <Brandmark d={d} />
      <div className="text-right">
        <div className="font-[Outfit] font-bold uppercase tracking-wider text-sm" style={{ color: d.accent }}>Proposta Comercial</div>
        <div className="text-xs mt-1" style={{ color: d.fg2 }}>Nº {formatProposalCode(p.id).base}</div>
        <div className="text-xs" style={{ color: d.fg3 }}>Emissão: {p.data}</div>
      </div>
    </div>
  );
}

function HeroClient({ p, d }) {
  // alinhado à esquerda — espelha o PDF gerado
  return (
    <div>
      <Eyebrow d={d}>Preparado para</Eyebrow>
      <div className="font-[Outfit] font-bold text-xl" style={{ color: d.fg }}>{p.cliente}</div>
      {p.cnpj && p.cnpj.trim() && (
        <div className="text-sm mt-1" style={{ color: d.fg2 }}>{cpfCnpjLabel(p.cnpj)}{'\u00A0'}{p.cnpj}</div>
      )}
    </div>
  );
}

function HeroIntro({ d, layout }) {
  return (
    <p className="text-sm leading-relaxed" style={{ color: d.fg2 }}>{INTRO}</p>
  );
}

/* ── construção das UNIDADES de fluxo (ordem do autor) ───────────── */
function buildUnits({ p, d, total, blocks, layout }) {
  const units = [];
  // gapBefore = espaço semântico ACIMA desta unidade (ver escala SP)
  const push = (key, node, gapBefore, keepWithNext = false) => units.push({ key, node, gapBefore, keepWithNext });

  // capa / lead
  push('hero', <HeroBrand p={p} d={d} />, 0, true);
  push('client', <HeroClient p={p} d={d} />, SP.hero);
  push('intro', <HeroIntro d={d} layout={layout} />, SP.block);

  // corpo — caminha pelos blocos em ordem de autoria
  const firstItem = (blocks.find((b) => b.type === 'item') || {}).id;
  let clauseN = 0;
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === 'item') {
      const run = [];
      while (i < blocks.length && blocks[i].type === 'item') { run.push(blocks[i]); i++; }
      const withHead = run.some((x) => x.id === firstItem);
      // título de seção: respiro de seção acima, e "cola" no 1º item (keep-with-next)
      if (withHead) push('escopo-head', <Eyebrow d={d} accent>Escopo &amp; Investimento</Eyebrow>, SP.section, true);
      run.forEach((it, ri) => {
        // 1º item: encosta no título (title); demais: ritmo de lista (stack)
        const gb = ri === 0 ? (withHead ? SP.title : SP.section) : SP.stack;
        push('item-' + it.id, <ItemRow b={it} d={d} />, gb);
      });
    } else {
      if (b.type === 'clausula') clauseN++;
      const map = { tabela: TabelaView, clausula: ClausulaView, etapas: EtapasView, nota: NotaView, exclusao: ExclusaoView, texto: TextoView };
      const V = map[b.type];
      // blocos com EYEBROW próprio (título "nu" na página) abrem nova seção;
      // cards autossuficientes (cláusula/nota) usam ritmo de bloco.
      const headed = (b.type === 'tabela' || b.type === 'etapas' || b.type === 'texto' || b.type === 'exclusao') && b.titulo;
      push('blk-' + b.id, <V b={b} d={d} n={b.type === 'clausula' ? clauseN : undefined} />, headed ? SP.section : SP.block);
      i++;
    }
  }

  // fecho
  if (total > 0) push('total', <InvestmentBar total={total} d={d} />, SP.section);
  push('conditions', <Conditions p={p} d={d} />, SP.block);
  push('signature', <Signature d={d} />, SP.section);

  return units;
}

/* ── empacotador greedy: bloco atômico + keep-with-next ──────────── */
function packUnits(units, heights, maxH) {
  const pages = [];
  let cur = [], h = 0, i = 0;
  const lead = (k) => units[k].gapBefore || 0;
  while (i < units.length) {
    // grupo = unidade + (se keep-with-next) a próxima unidade, indivisível
    const group = [i];
    if (units[i].keepWithNext && i + 1 < units.length) group.push(i + 1);
    let gH = 0;
    group.forEach((k, gi) => { gH += heights[k] + (gi ? lead(k) : 0); });
    const before = cur.length ? lead(group[0]) : 0;
    if (cur.length && h + before + gH > maxH) { pages.push(cur); cur = []; h = 0; }
    const before2 = cur.length ? lead(group[0]) : 0;
    group.forEach((k) => cur.push(k));
    h += before2 + gH;
    i = group[group.length - 1] + 1;
  }
  if (cur.length) pages.push(cur);
  return pages.length ? pages : [units.map((_, k) => k)];
}

/* ── uma FOLHA A4 com cromo (header corrido + rodapé + numeração) ── */
function DocPage({ pageIndex, pageCount, p, d, showBrackets, children }) {
  return (
    <div className="doc-page relative" style={{ width: PAGE_W, height: PAGE_H, background: d.sheet, color: d.fg, border: `1px solid ${d.a(0.18)}`, borderRadius: 16, boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)', overflow: 'hidden', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      {/* gridline */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right,${d.grid} 1px,transparent 1px),linear-gradient(to bottom,${d.grid} 1px,transparent 1px)`, backgroundSize: '40px 40px' }}></div>
      {/* cantos só na capa */}
      {showBrackets && pageIndex === 0 && ['top-6 left-6 border-t-2 border-l-2', 'top-6 right-6 border-t-2 border-r-2', 'bottom-6 left-6 border-b-2 border-l-2', 'bottom-6 right-6 border-b-2 border-r-2'].map((c, i) => (
        <div key={i} className={'absolute w-7 h-7 pointer-events-none ' + c} style={{ borderColor: d.accent }}></div>
      ))}

      {/* cabeçalho corrido removido — a prévia espelha o PDF (sem logo no topo das pp. 2+) */}

      {/* conteúdo paginado — ritmo vertical vem do marginTop por unidade */}
      <div className="flow-stack" style={{ position: 'absolute', top: HEADER_ZONE, left: PAD_X, right: PAD_X, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {/* rodapé + numeração */}
      <div className="absolute flex items-center justify-between pt-2.5 text-[10px]" style={{ left: PAD_X, right: PAD_X, bottom: 26, borderTop: `1px solid ${d.line}` }}>
        <span className="truncate max-w-[420px]" style={{ color: d.fg3 }}>CONFIDENCIAL · {p.cliente}</span>
        <span style={{ color: d.fg3 }}>Página {pageIndex + 1} de {pageCount}</span>
      </div>
    </div>
  );
}

/* ── motor de paginação: mede → empacota → renderiza folhas ──────── */
function Paginated({ p, d, total, blocks, layout, showBrackets, onPageCount }) {
  const units = React.useMemo(() => buildUnits({ p, d, total, blocks, layout }), [p, d, total, blocks, layout]);
  const measRef = React.useRef(null);
  const [pages, setPages] = React.useState(null);

  React.useLayoutEffect(() => {
    let cancelled = false;
    const remeasure = () => {
      if (cancelled || !measRef.current) return;
      const kids = Array.from(measRef.current.children);
      // offsetHeight ignora o transform:scale da folha (a prévia é reduzida
      // p/ caber na viewport); getBoundingClientRect devolveria a altura
      // ESCALADA e a paginação acharia que tudo cabe numa página (clipping).
      const heights = kids.map((k) => k.offsetHeight);
      setPages(packUnits(units, heights, CONTENT_H));
    };
    remeasure();
    // refaz quando as fontes carregam (alturas mudam) + fallback
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(remeasure));
    const t = setTimeout(remeasure, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [units]);

  React.useEffect(() => { if (pages && onPageCount) onPageCount(pages.length); }, [pages]);

  const view = pages || [units.map((_, k) => k)];

  return (
    <>
      {/* camada de medição — fora da tela, mesma largura de conteúdo */}
      <div ref={measRef} aria-hidden="true" style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', left: -99999, top: 0, width: CONTENT_W }}>
        {units.map((u) => <div key={u.key} className="flow-unit">{u.node}</div>)}
      </div>

      {view.map((idxs, pi) => (
        <DocPage key={pi} pageIndex={pi} pageCount={view.length} p={p} d={d} showBrackets={showBrackets}>
          {idxs.map((k, pos) => <div key={units[k].key} className="flow-unit" style={{ marginTop: pos === 0 ? 0 : (units[k].gapBefore || 0) }}>{units[k].node}</div>)}
        </DocPage>
      ))}
    </>
  );
}

function ProposalDoc({ proposal, onClose, theme = 'dark', layout = 'classic', grid = 'subtle', accent = 'gold' }) {
  const [pageCount, setPageCount] = React.useState(1);
  const [scale, setScale] = React.useState(1);
  const [downloading, setDownloading] = React.useState(false);

  // escala as folhas para caber na largura da viewport (apenas na tela)
  React.useLayoutEffect(() => {
    const fit = () => {
      const avail = Math.min(PAGE_W, window.innerWidth - 48);
      setScale(Math.max(0.3, avail / PAGE_W));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // FIREWALL DO PDF: o documento do cliente é SEMPRE tema claro (foco em
  // impressão) e cego para metadados internos (status, origem, comissões
  // nunca chegam aqui — só cliente, escopo, pagamento e validade).
  const d = React.useMemo(() => buildDocTheme('light', accent, grid), [accent, grid]);

  if (!proposal) return null;
  const p = proposal;
  const blocks = Array.isArray(p.blocks) && p.blocks.length ? p.blocks
    : [{ id: 'legacy', type: 'item', titulo: 'Escopo técnico de engenharia elétrica', detalhe: p.escopo, valor: p.valor }];
  const total = proposalTotal(p);
  const showBrackets = false; // cantoneiras douradas removidas da capa

  // "Baixar PDF" — abre a impressão nativa (Salvar como PDF), que é o
  // espelho vetorial perfeito da prévia (ver ProposalPdf.jsx).
  const downloadPdf = () => {
    if (window.downloadProposalPdf) window.downloadProposalPdf(p, { total, accent });
    else window.print();
  };

  const natH = pageCount * PAGE_H + (pageCount - 1) * PAGE_GAP;

  return (
    <div className="doc-overlay fixed inset-0 z-[300] overflow-y-auto" style={{ background: 'rgba(3,4,6,0.92)', backdropFilter: 'blur(8px)' }}>
      {/* overlay chrome */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-4"
        style={{ background: 'rgba(5,7,10,0.7)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white" style={{ color: T.fg2 }}>
          <Icon name="arrow-left" className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider hidden sm:flex items-center gap-1.5" style={{ color: T.fg3 }}>
            Documento · <ProposalCode code={p.id} />
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: 'rgba(225,177,79,0.12)', color: T.gold, border: '1px solid rgba(225,177,79,0.28)' }}>
            <Icon name="files" className="w-3 h-3" /> {pageCount} {pageCount === 1 ? 'página' : 'páginas'} · A4
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadPdf}
            className="flex items-center gap-2 text-xs font-semibold rounded-full px-4 py-2 transition-all hover:shadow-[0_0_20px_rgba(225,177,79,0.5)]"
            style={{ background: T.gold, color: T.s1 }}>
            <Icon name="download" className="w-3.5 h-3.5" /> Baixar PDF
          </button>
        </div>
      </div>

      {/* as folhas (escaladas para a tela; tamanho real no print) */}
      <div className="doc-print-area py-10 px-4 flex justify-center">
        <div className="doc-sizer" style={{ width: PAGE_W * scale, height: natH * scale, position: 'relative' }}>
          <div className="doc-pages" style={{ position: 'absolute', top: 0, left: 0, width: PAGE_W, transform: `scale(${scale})`, transformOrigin: 'top left', display: 'flex', flexDirection: 'column', gap: PAGE_GAP }}>
            <Paginated p={p} d={d} total={total} blocks={blocks} layout={layout} showBrackets={showBrackets} onPageCount={setPageCount} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProposalDoc });
