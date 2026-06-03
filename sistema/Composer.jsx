/* Composer — overlay de autoria da proposta por blocos.
   O engenheiro monta o documento como um contrato: dados do cliente +
   uma sequência ordenada de blocos tipados. Emite ao final. */

const cinput = 'w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#E1B14F] placeholder:text-gray-600';
const clabel = 'text-[10px] font-semibold uppercase tracking-wider';

/* DatePicker — seletor de data com calendário (popover, pt-BR).
   Clica no campo → abre o calendário; escolhe o dia → fecha. Guarda ISO. */
function DatePicker({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const today = React.useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const selected = isoToDate(value);
  const [view, setView] = React.useState(() => { const b = selected || today; return new Date(b.getFullYear(), b.getMonth(), 1); });

  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  React.useEffect(() => { if (open) { const b = selected || today; setView(new Date(b.getFullYear(), b.getMonth(), 1)); } }, [open]);

  const year = view.getFullYear(), month = view.getMonth();
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  const sameDay = (a, b) => a && b && a.getTime() === b.getTime();

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={cinput + ' flex items-center justify-between text-left cursor-pointer ' + (open ? 'border-[#E1B14F]' : '')}>
        <span style={{ color: selected ? '#fff' : '#6b7280' }}>{selected ? fmtDateBR(value) : 'Selecione uma data'}</span>
        <Icon name="calendar" className="w-4 h-4 shrink-0" style={{ color: T.gold }} />
      </button>
      {open && (
        <div className="absolute z-40 mt-2 p-3 rounded-xl w-[290px]"
          style={{ background: T.s1, border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.7)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <button type="button" onClick={() => setView(new Date(year, month - 1, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"><Icon name="chevron-left" className="w-4 h-4" style={{ color: T.fg2 }} /></button>
            <span className="text-sm font-semibold text-white capitalize">{MESES_PT[month]} {year}</span>
            <button type="button" onClick={() => setView(new Date(year, month + 1, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"><Icon name="chevron-right" className="w-4 h-4" style={{ color: T.fg2 }} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold py-1" style={{ color: T.fg3 }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => d ? (
              <button key={i} type="button" onClick={() => { onChange(dateToISO(d)); setOpen(false); }}
                className="h-8 rounded-lg text-sm flex items-center justify-center transition-colors"
                style={sameDay(d, selected)
                  ? { background: T.gold, color: T.s1, fontWeight: 700 }
                  : { color: d.getTime() < today.getTime() ? T.fg3 : '#E6E8EC', border: sameDay(d, today) ? '1px solid rgba(225,177,79,0.5)' : '1px solid transparent' }}
                onMouseEnter={(e) => { if (!sameDay(d, selected)) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={(e) => { if (!sameDay(d, selected)) e.currentTarget.style.background = 'transparent'; }}>
                {d.getDate()}
              </button>
            ) : <div key={i}></div>)}
          </div>
          <button type="button" onClick={() => { onChange(dateToISO(today)); setOpen(false); }}
            className="w-full mt-2.5 text-xs font-medium py-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: T.gold }}>Hoje</button>
        </div>
      )}
    </div>
  );
}

function MiniBtn({ icon, label, onClick, tone }) {
  const c = tone === 'danger' ? '#f87171' : T.fg2;
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 transition-colors hover:bg-white/5"
      style={{ color: c, border: '1px solid rgba(255,255,255,0.1)' }}>
      <Icon name={icon} className="w-3.5 h-3.5" />{label}
    </button>
  );
}

/* ── per-type editors ─────────────────────────────────────────────── */
function ItemEditor({ b, set }) {
  return (
    <div className="flex flex-col gap-3">
      <input className={cinput} placeholder="Título do serviço (ex.: Projeto executivo de quadros)" value={b.titulo} onChange={(e) => set({ titulo: e.target.value })} />
      <textarea rows="2" className={cinput + ' resize-none'} placeholder="Detalhamento técnico do item…" value={b.detalhe} onChange={(e) => set({ detalhe: e.target.value })}></textarea>
      <div className="flex items-center gap-2 max-w-[240px]">
        <span className="text-sm font-semibold" style={{ color: T.gold }}>R$</span>
        <input className={cinput} inputMode="numeric" placeholder="0,00" value={b.valor} onChange={(e) => set({ valor: maskMoeda(e.target.value) })} />
      </div>
    </div>
  );
}

function TabelaEditor({ b, set }) {
  const vc = b.valorCol ?? null;
  const qc = b.qtdCol ?? null;
  const setCol = (i, v) => { const c = [...b.colunas]; c[i] = v; set({ colunas: c }); };
  const setCell = (r, c, v) => { const L = b.linhas.map((row) => [...row]); L[r][c] = (c === vc ? maskMoeda(v) : c === qc ? maskQtd(v) : v); set({ linhas: L }); };
  const addCol = () => set({ colunas: [...b.colunas, 'Coluna'], linhas: b.linhas.map((r) => [...r, '']) });
  const shift = (col, removed) => (col == null ? null : (removed === col ? null : (removed < col ? col - 1 : col)));
  const delCol = (i) => {
    if (b.colunas.length <= 1) return;
    set({ colunas: b.colunas.filter((_, x) => x !== i), linhas: b.linhas.map((r) => r.filter((_, x) => x !== i)), valorCol: shift(vc, i), qtdCol: shift(qc, i) });
  };
  const addRow = () => set({ linhas: [...b.linhas, b.colunas.map(() => '')] });
  const delRow = (i) => set({ linhas: b.linhas.filter((_, x) => x !== i) });
  // Marca/desmarca a coluna de VALOR (converte células p/ moeda; libera de qtd se preciso).
  const toggleValor = (i) => {
    if (vc === i) { set({ valorCol: null }); return; }
    set({ valorCol: i, qtdCol: qc === i ? null : qc, linhas: b.linhas.map((r) => r.map((cell, c) => (c === i ? maskMoeda(cell) : cell))) });
  };
  // Marca/desmarca a coluna de QUANTIDADE (só números; libera de valor se preciso).
  const toggleQtd = (i) => {
    if (qc === i) { set({ qtdCol: null }); return; }
    set({ qtdCol: i, valorCol: vc === i ? null : vc, linhas: b.linhas.map((r) => r.map((cell, c) => (c === i ? maskQtd(cell) : cell))) });
  };
  const subtotal = blockMoney(b);
  const colTag = (i) => (i === vc ? 'valor' : i === qc ? 'qtd' : null);

  return (
    <div className="flex flex-col gap-3">
      <input className={cinput} placeholder="Título da tabela (ex.: Materiais principais)" value={b.titulo} onChange={(e) => set({ titulo: e.target.value })} />
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* column headers */}
        <div className="flex items-stretch" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {b.colunas.map((c, i) => {
            const tag = colTag(i);
            return (
              <div key={i} className="flex items-center gap-1 px-2 py-1.5 flex-1 min-w-0" style={{ borderLeft: i ? '1px solid rgba(255,255,255,0.06)' : 'none', background: tag === 'valor' ? 'rgba(225,177,79,0.07)' : tag === 'qtd' ? 'rgba(160,170,181,0.08)' : 'transparent' }}>
                <input className="w-full bg-transparent text-[11px] font-semibold uppercase tracking-wider outline-none" style={{ color: tag === 'valor' ? T.gold : tag === 'qtd' ? '#CDD4DC' : '#fff' }} value={c} onChange={(e) => setCol(i, e.target.value)} />
                <button type="button" onClick={() => toggleQtd(i)} title={i === qc ? 'Coluna de quantidade (× valor). Clique p/ desmarcar' : 'Marcar como quantidade (só números)'}
                  className="shrink-0 text-[9px] font-bold leading-none px-1 py-0.5 rounded transition-colors"
                  style={i === qc ? { color: T.s1, background: T.fg2 } : { color: T.fg3, border: '1px solid rgba(255,255,255,0.18)' }}>×N</button>
                <button type="button" onClick={() => toggleValor(i)} title={i === vc ? 'Coluna de valor — soma ao investimento. Clique p/ desmarcar' : 'Marcar como coluna de valor'}
                  className="shrink-0 text-[9px] font-bold leading-none px-1 py-0.5 rounded transition-colors"
                  style={i === vc ? { color: T.s1, background: T.gold } : { color: T.fg3, border: '1px solid rgba(255,255,255,0.18)' }}>R$</button>
                {b.colunas.length > 1 && (
                  <button type="button" onClick={() => delCol(i)} title="Remover coluna" className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"><Icon name="x" className="w-3 h-3" style={{ color: '#f87171' }} /></button>
                )}
              </div>
            );
          })}
        </div>
        {/* rows */}
        {b.linhas.map((row, r) => (
          <div key={r} className="flex items-stretch group" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {row.map((cell, c) => {
              const tag = colTag(c);
              return (
                <div key={c} className="flex-1 min-w-0" style={{ borderLeft: c ? '1px solid rgba(255,255,255,0.06)' : 'none', background: tag === 'valor' ? 'rgba(225,177,79,0.045)' : tag === 'qtd' ? 'rgba(160,170,181,0.05)' : 'transparent' }}>
                  <input className="w-full bg-transparent px-2 py-1.5 text-sm outline-none focus:bg-white/[0.03] tabular-nums"
                    style={{ color: tag === 'valor' ? T.gold : tag === 'qtd' ? '#CDD4DC' : '#fff', textAlign: tag ? 'right' : 'left' }}
                    inputMode={tag ? 'numeric' : undefined}
                    value={cell} onChange={(e) => setCell(r, c, e.target.value)} placeholder={tag === 'valor' ? '0,00' : tag === 'qtd' ? '0' : '—'} />
                </div>
              );
            })}
            <button type="button" onClick={() => delRow(r)} title="Remover linha" className="px-2 shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"><Icon name="trash-2" className="w-3.5 h-3.5" style={{ color: '#f87171' }} /></button>
          </div>
        ))}
        {/* subtotal (só quando há coluna de valor) */}
        {vc != null && (
          <div className="flex items-center justify-between px-2.5 py-2" style={{ borderTop: '1px solid rgba(225,177,79,0.28)', background: 'rgba(225,177,79,0.06)' }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.fg2 }}>Subtotal</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: T.gold }}>{BRL(subtotal)}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <MiniBtn icon="plus" label="Linha" onClick={addRow} />
        <MiniBtn icon="columns-3" label="Coluna" onClick={addCol} />
        <span className="text-[11px] ml-auto pr-1 text-right" style={{ color: vc == null ? T.fg3 : T.gold }}>
          {vc == null ? 'R$ = soma · ×N = multiplica' : qc != null ? 'Somando qtd × valor' : 'Somando ao investimento'}
        </span>
      </div>
    </div>
  );
}

function ClausulaEditor({ b, set }) {
  return (
    <div className="flex flex-col gap-3">
      <input className={cinput} placeholder="Título da cláusula (ex.: Garantia técnica)" value={b.titulo} onChange={(e) => set({ titulo: e.target.value })} />
      <textarea rows="3" className={cinput + ' resize-none'} placeholder="Texto do termo contratual…" value={b.texto} onChange={(e) => set({ texto: e.target.value })}></textarea>
    </div>
  );
}

function EtapasEditor({ b, set }) {
  const setFase = (i, k, v) => { const f = b.fases.map((x) => ({ ...x })); f[i][k] = v; set({ fases: f }); };
  const add = () => set({ fases: [...b.fases, { nome: '', prazo: '' }] });
  const del = (i) => set({ fases: b.fases.filter((_, x) => x !== i) });
  return (
    <div className="flex flex-col gap-3">
      <input className={cinput} placeholder="Título (ex.: Cronograma de execução)" value={b.titulo} onChange={(e) => set({ titulo: e.target.value })} />
      <div className="flex flex-col gap-2">
        {b.fases.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: 'rgba(225,177,79,0.15)', color: T.gold }}>{i + 1}</span>
            <input className={cinput} placeholder="Fase / etapa" value={f.nome} onChange={(e) => setFase(i, 'nome', e.target.value)} />
            <input className={cinput + ' max-w-[150px]'} placeholder="Prazo" value={f.prazo} onChange={(e) => setFase(i, 'prazo', e.target.value)} />
            <button type="button" onClick={() => del(i)} className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"><Icon name="trash-2" className="w-3.5 h-3.5" style={{ color: '#f87171' }} /></button>
          </div>
        ))}
      </div>
      <div><MiniBtn icon="plus" label="Adicionar fase" onClick={add} /></div>
    </div>
  );
}

function NotaEditor({ b, set }) {
  return <textarea rows="2" className={cinput + ' resize-none'} placeholder="Observação técnica em destaque…" value={b.texto} onChange={(e) => set({ texto: e.target.value })}></textarea>;
}

function ExclusaoEditor({ b, set }) {
  const setItem = (i, v) => { const it = [...b.itens]; it[i] = v; set({ itens: it }); };
  const add = () => set({ itens: [...b.itens, ''] });
  const del = (i) => set({ itens: b.itens.filter((_, x) => x !== i) });
  return (
    <div className="flex flex-col gap-3">
      <input className={cinput} placeholder="Título (ex.: Não está incluso)" value={b.titulo} onChange={(e) => set({ titulo: e.target.value })} />
      <div className="flex flex-col gap-2">
        {b.itens.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Icon name="circle-slash" className="w-3.5 h-3.5 shrink-0" style={{ color: T.fg3 }} />
            <input className={cinput} placeholder="O que fica fora do escopo" value={it} onChange={(e) => setItem(i, e.target.value)} />
            <button type="button" onClick={() => del(i)} className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"><Icon name="trash-2" className="w-3.5 h-3.5" style={{ color: '#f87171' }} /></button>
          </div>
        ))}
      </div>
      <div><MiniBtn icon="plus" label="Adicionar item" onClick={add} /></div>
    </div>
  );
}

function TextoEditor({ b, set }) {
  return (
    <div className="flex flex-col gap-3">
      <input className={cinput} placeholder="Subtítulo da seção (ex.: Contexto)" value={b.titulo} onChange={(e) => set({ titulo: e.target.value })} />
      <textarea rows="3" className={cinput + ' resize-none'} placeholder="Parágrafo livre…" value={b.corpo} onChange={(e) => set({ corpo: e.target.value })}></textarea>
    </div>
  );
}

const EDITORS = { item: ItemEditor, tabela: TabelaEditor, clausula: ClausulaEditor, etapas: EtapasEditor, nota: NotaEditor, exclusao: ExclusaoEditor, texto: TextoEditor };

function BlockCard({ b, i, count, onMove, onRemove, onChange, dnd }) {
  const meta = BLOCK_TYPES[b.type];
  const Editor = EDITORS[b.type];
  const set = (patch) => onChange({ ...b, ...patch });
  const dragging = dnd.dragIdx === i;
  const isOver = dnd.overIdx === i && dnd.dragIdx != null && dnd.dragIdx !== i;
  const dropBelow = isOver && dnd.dragIdx < i; // mostra a guia embaixo se vier de cima
  return (
    <div
      onDragOver={(e) => { if (dnd.dragIdx != null) { e.preventDefault(); dnd.onOver(i); } }}
      onDrop={(e) => { e.preventDefault(); dnd.onDrop(i); }}
      className="rounded-xl transition-shadow"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid ' + (isOver ? 'rgba(225,177,79,0.6)' : 'rgba(255,255,255,0.08)'),
        opacity: dragging ? 0.4 : 1,
        boxShadow: isOver ? (dropBelow ? '0 2px 0 -1px ' + T.gold + ' inset, 0 0 0 0 transparent' : '0 0 0 0 transparent') : 'none',
        borderTop: isOver && !dropBelow ? '2px solid ' + T.gold : '1px solid ' + (isOver ? 'rgba(225,177,79,0.6)' : 'rgba(255,255,255,0.08)'),
      }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span
          draggable
          onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (err) {} dnd.onStart(i); }}
          onDragEnd={dnd.onEnd}
          title="Arraste para reordenar"
          className="shrink-0 w-6 h-7 -ml-1 rounded-md flex items-center justify-center transition-colors hover:bg-white/5 cursor-grab active:cursor-grabbing"
          style={{ color: T.fg3 }}><Icon name="grip-vertical" className="w-4 h-4" /></span>
        <Icon name={meta.icon} className="w-4 h-4" style={{ color: T.gold }} />
        <span className="text-sm font-semibold text-white">{meta.label}</span>
        {(b.type === 'item' || (b.type === 'tabela' && b.valorCol != null)) && <span className="text-xs" style={{ color: T.fg3 }}>· soma ao total</span>}
        <div className="ml-auto flex items-center gap-0.5">
          <button type="button" disabled={i === 0} onClick={() => onMove(i, -1)} title="Mover para cima" className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/5 disabled:opacity-25" style={{ color: T.fg2 }}><Icon name="chevron-up" className="w-4 h-4" /></button>
          <button type="button" disabled={i === count - 1} onClick={() => onMove(i, 1)} title="Mover para baixo" className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/5 disabled:opacity-25" style={{ color: T.fg2 }}><Icon name="chevron-down" className="w-4 h-4" /></button>
          <button type="button" onClick={() => onRemove(b.id)} title="Excluir bloco" className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[rgba(248,113,113,0.12)]" style={{ color: T.fg3 }}><Icon name="trash-2" className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="p-4"><Editor b={b} set={set} /></div>
    </div>
  );
}

function AddBlockMenu({ onAdd }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors hover:border-[#E1B14F] hover:text-white"
          style={{ color: T.gold, border: '1.5px dashed rgba(225,177,79,0.35)', background: 'rgba(225,177,79,0.03)' }}>
          <Icon name="plus" className="w-4 h-4" /> Adicionar bloco ao escopo
        </button>
      ) : (
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.fg3 }}>Escolha o tipo de bloco</span>
            <button type="button" onClick={() => setOpen(false)}><Icon name="x" className="w-4 h-4" style={{ color: T.fg3 }} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BLOCK_ORDER.map((t) => {
              const m = BLOCK_TYPES[t];
              return (
                <button key={t} type="button" onClick={() => { onAdd(t); setOpen(false); }}
                  className="flex items-start gap-2.5 text-left rounded-lg p-2.5 transition-colors hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'rgba(225,177,79,0.12)' }}><Icon name={m.icon} className="w-4 h-4" style={{ color: T.gold }} /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{m.label}</span>
                    <span className="block text-xs leading-snug" style={{ color: T.fg3 }}>{m.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* Converte número (ex.: 9400) → string da máscara de moeda ("9.400,00")
   para reidratar o formulário ao editar um rascunho/proposta. */
function moneyToMask(n) {
  const v = Number(n) || 0;
  return v ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
}

/* Autocomplete de cliente — busca no Supabase (debounced) ou
   digita um novo (cadastrado ao salvar). */
function ClientAutocomplete({ value, onPick, onName }) {
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const ref = React.useRef(null);
  const timer = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const doSearch = (q) => {
    clearTimeout(timer.current);
    if (!q || q.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      const data = await sbSearchClients(q);
      setResults(data.map((c) => ({ key: c.id, nome: c.name, cnpj: c.cnpj || '', origem: c.origin || '', _dbId: c.id })));
    }, 300);
  };
  const s = (value || '').trim().toLowerCase();
  const matches = results.filter((c) => c.nome && c.nome.toLowerCase().includes(s)).slice(0, 6);
  const exact = results.some((c) => c.nome && c.nome.toLowerCase() === s);
  return (
    <div className="relative" ref={ref}>
      <input className={cinput} value={value} maxLength={50}
        onChange={(e) => { const v = e.target.value.slice(0, 50); onName(v); setOpen(true); doSearch(v); }}
        onFocus={() => { setOpen(true); doSearch(value); }} placeholder="Razão social / nome do cliente" />
      {open && matches.length > 0 && (
        <div className="absolute z-40 mt-1 left-0 right-0 rounded-xl overflow-hidden py-1" style={{ background: T.s1, border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.7)' }}>
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.fg3 }}>Clientes na base</div>
          {matches.map((c) => (
            <button key={c.key} type="button" onClick={() => { onPick(c); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2.5">
              <span className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'rgba(225,177,79,0.12)' }}><Icon name="building-2" className="w-3.5 h-3.5" style={{ color: T.gold }} /></span>
              <span className="min-w-0"><span className="block text-sm text-white truncate">{c.nome}</span><span className="block text-[11px]" style={{ color: T.fg3 }}>{cpfCnpjLabel(c.cnpj)} {c.cnpj}</span></span>
            </button>
          ))}
        </div>
      )}
      {value.trim() && !exact && (
        <div className="flex items-center gap-1.5 mt-1.5 text-[11px]" style={{ color: T.gold }}><Icon name="user-plus" className="w-3 h-3" /> Novo cliente — será cadastrado ao salvar.</div>
      )}
    </div>
  );
}

function Composer({ open, onClose, onEmit, onSaveDraft, editing }) {
  const blank = () => ({ cliente: '', cnpj: '', pagamento: PAYMENT_OPTIONS[0], pagamentoCustom: '', validade: futureISO(15), origem: '' });
  const [meta, setMeta] = React.useState(blank);
  const [blocks, setBlocks] = React.useState(() => [newBlock('item')]);
  const setM = (k) => (e) => setMeta({ ...meta, [k]: e.target.value });

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      const isCustomPay = editing.pagamento && !PAYMENT_OPTIONS.includes(editing.pagamento);
      setMeta({
        cliente: editing.cliente || '', cnpj: editing.cnpj || '',
        pagamento: isCustomPay ? PAYMENT_CUSTOM : (editing.pagamento || PAYMENT_OPTIONS[0]),
        pagamentoCustom: isCustomPay ? editing.pagamento : '',
        validade: editing.validade || futureISO(15), origem: editing.origem || '',
        _dbId: editing._dbId || null, _clientId: editing._clientId || null,
      });
      setBlocks((editing.blocks && editing.blocks.length ? editing.blocks : [newBlock('item')]).map((b) => b.type === 'item' ? { ...b, valor: moneyToMask(b.valor) } : { ...b }));
    } else {
      setMeta(blank()); setBlocks([newBlock('item')]);
    }
    setSaving(false); setSaveErr(null);
  }, [open, editing]);

  const total = blocks.reduce((a, b) => a + blockMoney(b), 0);
  const moneyCount = blocks.filter((b) => b.type === 'item' || (b.type === 'tabela' && b.valorCol != null)).length;

  const addBlock = (t) => setBlocks((bs) => [...bs, newBlock(t)]);
  const changeBlock = (nb) => setBlocks((bs) => bs.map((b) => (b.id === nb.id ? nb : b)));
  const removeBlock = (id) => setBlocks((bs) => bs.filter((b) => b.id !== id));
  const moveBlock = (i, d) => setBlocks((bs) => { const a = [...bs]; const j = i + d; if (j < 0 || j >= a.length) return bs; [a[i], a[j]] = [a[j], a[i]]; return a; });

  // Arrastar-e-soltar: reordena os blocos do escopo.
  const [dragIdx, setDragIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);
  const reorder = (from, to) => setBlocks((bs) => {
    if (from == null || to == null || from === to) return bs;
    const a = [...bs]; const [moved] = a.splice(from, 1); a.splice(to, 0, moved); return a;
  });
  const dnd = {
    dragIdx, overIdx,
    onStart: (i) => { setDragIdx(i); setOverIdx(i); },
    onOver: (i) => setOverIdx((cur) => (cur === i ? cur : i)),
    onDrop: (i) => { reorder(dragIdx, i); setDragIdx(null); setOverIdx(null); },
    onEnd: () => { setDragIdx(null); setOverIdx(null); },
  };

  const pickClient = (c) => setMeta((m) => ({ ...m, cliente: c.nome, cnpj: c.cnpj, origem: c.origem || m.origem, _clientId: c._dbId || null }));
  const effectivePay = meta.pagamento === PAYMENT_CUSTOM ? meta.pagamentoCustom : meta.pagamento;
  const serialize = () => ({
    ...(editing ? { id: editing.id, _dbId: editing._dbId } : {}),
    ...meta, pagamento: effectivePay,
    blocks: blocks.map((b) => ({ ...b, valor: b.type === 'item' ? parseBRL(b.valor) : b.valor })),
  });

  const canEmit = meta.cliente.trim() && meta.origem && moneyCount > 0 && effectivePay.trim();
  const canDraft = meta.cliente.trim().length > 0;
  const [saving, setSaving] = React.useState(false);
  const [saveErr, setSaveErr] = React.useState(null);

  const emit = async () => {
    if (!canEmit || saving) return;
    setSaving(true); setSaveErr(null);
    try {
      const d = serialize();
      // Upsert client via RPC
      const client = await sbUpsertClient({ name: d.cliente, cnpj: d.cnpj || null, origin: d.origem || null });
      if (d._dbId) {
        // Updating existing proposal (director edit)
        await sbUpdateProposal(d._dbId, {
          client_id: client.id, status: d.draft === true ? 'Enviado' : 'Enviado',
          is_draft: false, scope_blocks: d.blocks, total_value: proposalTotal(d),
          payment_method: d.pagamento, validity_date: d.validade || null, origin: d.origem,
        });
      } else {
        await sbCreateProposal({
          clientId: client.id, status: 'Enviado', isDraft: false,
          blocks: d.blocks, totalValue: proposalTotal(d),
          paymentMethod: d.pagamento, validityDate: d.validade || null, origin: d.origem,
        });
      }
      onEmit(); onClose();
    } catch (err) {
      console.error('Emit error:', err);
      setSaveErr(err.message || 'Erro ao emitir proposta.');
    }
    setSaving(false);
  };

  const saveDraft = async () => {
    if (!canDraft || saving) return;
    setSaving(true); setSaveErr(null);
    try {
      const d = serialize();
      const client = await sbUpsertClient({ name: d.cliente, cnpj: d.cnpj || null, origin: d.origem || null });
      if (d._dbId) {
        await sbUpdateProposal(d._dbId, {
          client_id: client.id, status: 'Rascunho',
          is_draft: true, scope_blocks: d.blocks, total_value: proposalTotal(d),
          payment_method: d.pagamento, validity_date: d.validade || null, origin: d.origem || null,
        });
      } else {
        await sbCreateProposal({
          clientId: client.id, status: 'Rascunho', isDraft: true,
          blocks: d.blocks, totalValue: proposalTotal(d),
          paymentMethod: d.pagamento, validityDate: d.validade || null, origin: d.origem || null,
        });
      }
      onSaveDraft(); onClose();
    } catch (err) {
      console.error('Draft error:', err);
      setSaveErr(err.message || 'Erro ao salvar rascunho.');
    }
    setSaving(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[250] overflow-y-auto" style={{ background: 'rgba(3,4,6,0.92)', backdropFilter: 'blur(8px)' }}>
      {/* sticky chrome */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 sm:px-8 py-4"
        style={{ background: 'rgba(5,7,10,0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white" style={{ color: T.fg2 }}>
          <Icon name="arrow-left" className="w-4 h-4" /> Cancelar
        </button>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: T.fg3 }}>Investimento total</div>
            <div className="font-[Outfit] font-bold text-lg" style={{ color: T.gold }}>{BRL(total)}</div>
          </div>
          <button onClick={saveDraft} disabled={!canDraft || saving} title="Salva sem travar — editável depois"
            className="flex items-center gap-2 font-medium rounded-full px-4 py-3 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-white/5"
            style={{ color: T.fg2, border: '1px solid rgba(255,255,255,0.15)' }}>
            <Icon name={saving ? 'loader-2' : 'save'} className={'w-4 h-4' + (saving ? ' animate-spin' : '')} /> <span className="hidden sm:inline">Salvar </span>Rascunho
          </button>
          <button onClick={emit} disabled={!canEmit || saving}
            className="flex items-center gap-2 font-semibold rounded-full px-6 py-3 text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:shadow-[0_0_22px_rgba(225,177,79,0.55)]"
            style={{ background: T.gold, color: T.s1 }}>
            {saving ? 'Emitindo…' : 'Emitir Proposta'} <Icon name={saving ? 'loader-2' : 'arrow-right'} className={'w-4 h-4' + (saving ? ' animate-spin' : '')} />
          </button>
        </div>
      </div>

      <div className="py-9 px-4 flex justify-center">
        <div className="w-full max-w-[760px] flex flex-col gap-5">
          <div>
            <h1 className="font-[Outfit] font-bold text-white text-2xl">{editing ? 'Editar Proposta' : 'Nova Proposta'}</h1>
            <p className="text-sm mt-1" style={{ color: T.fg2 }}>{editing ? <>Rascunho <b className="text-white">{editing.id}</b> — ajuste e emita quando estiver pronto.</> : 'Monte o escopo bloco a bloco. Vale quase como um contrato — itens somam o investimento, cláusulas e exclusões blindam o acordo.'}</p>
          </div>

          {/* client card */}
          <div className="rounded-2xl p-6" style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Icon name="building-2" className="w-4 h-4" style={{ color: T.gold }} />
              <span className="font-[Outfit] font-bold text-white">Dados do cliente</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className={clabel} style={{ color: T.fg2 }}>Nome do cliente</label>
                  <span className="text-[10px] tabular-nums" style={{ color: meta.cliente.length >= 50 ? T.gold : T.fg3 }}>{meta.cliente.length}/50</span>
                </div>
                <ClientAutocomplete value={meta.cliente} onPick={pickClient} onName={(v) => setMeta({ ...meta, cliente: v })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={clabel} style={{ color: T.fg2 }}>CPF / CNPJ <span style={{ color: T.fg3, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
                <input className={cinput} inputMode="numeric" value={meta.cnpj}
                  onChange={(e) => setMeta({ ...meta, cnpj: maskCpfCnpj(e.target.value) })}
                  placeholder="CPF ou CNPJ" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={clabel} style={{ color: T.fg2 }}>Origem do lead</label>
                <select className={cinput + ' appearance-none cursor-pointer'} value={meta.origem} onChange={setM('origem')}
                  style={{ color: meta.origem ? '#fff' : '#6b7280', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'none\' stroke=\'%23A0AAB5\' stroke-width=\'2\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                  <option value="" disabled>Selecione a origem do lead</option>
                  {LEAD_ORIGIN_KEYS.map((k) => <option key={k} value={k} style={{ color: '#fff', background: T.s1 }}>{k}</option>)}
                </select>
                {meta.origem && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <OriginTag origem={meta.origem} />
                    <span className="text-[11px]" style={{ color: T.fg3 }}>{isEligible(meta.origem) ? 'Gera 25% de comissão' : 'Sem comissão (orgânico)'}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={clabel} style={{ color: T.fg2 }}>Forma de pagamento</label>
                <select className={cinput + ' appearance-none cursor-pointer'} value={meta.pagamento}
                  onChange={(e) => setMeta({ ...meta, pagamento: e.target.value, pagamentoCustom: e.target.value === PAYMENT_CUSTOM ? meta.pagamentoCustom : '' })}
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'none\' stroke=\'%23A0AAB5\' stroke-width=\'2\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                  {PAYMENT_OPTIONS.map((k) => <option key={k} value={k} style={{ color: '#fff', background: T.s1 }}>{k}</option>)}
                  <option value={PAYMENT_CUSTOM} style={{ color: '#fff', background: T.s1 }}>{PAYMENT_CUSTOM}</option>
                </select>
                {meta.pagamento === PAYMENT_CUSTOM && (
                  <input className={cinput + ' mt-2'} value={meta.pagamentoCustom}
                    onChange={(e) => setMeta({ ...meta, pagamentoCustom: e.target.value })}
                    placeholder="Descreva as condições de pagamento…" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={clabel} style={{ color: T.fg2 }}>Validade da proposta</label>
                <DatePicker value={meta.validade} onChange={(iso) => setMeta({ ...meta, validade: iso })} />
              </div>
            </div>
          </div>

          {/* scope builder */}
          <div className="flex items-center gap-2.5 mt-1">
            <span className="font-[Outfit] font-bold text-white">Escopo &amp; condições</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: T.fg2 }}>{blocks.length} {blocks.length === 1 ? 'bloco' : 'blocos'}</span>
            {blocks.length > 1 && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] ml-auto" style={{ color: T.fg3 }}>
                <Icon name="grip-vertical" className="w-3.5 h-3.5" /> Arraste para reordenar
              </span>
            )}
          </div>

          {blocks.map((b, i) => (
            <BlockCard key={b.id} b={b} i={i} count={blocks.length} onMove={moveBlock} onRemove={removeBlock} onChange={changeBlock} dnd={dnd} />
          ))}

          <AddBlockMenu onAdd={addBlock} />

          {saveErr && (
            <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
              <Icon name="alert-circle" className="w-3.5 h-3.5 shrink-0" /> {saveErr}
            </div>
          )}
          {!canEmit && !saveErr && (
            <div className="flex items-center gap-2 text-xs" style={{ color: T.fg3 }}>
              <Icon name="info" className="w-3.5 h-3.5" /> Para emitir: cliente, origem do lead e ao menos um item com valor. Sem tudo isso, use <b style={{ color: T.fg2 }}>Salvar Rascunho</b>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Composer });
