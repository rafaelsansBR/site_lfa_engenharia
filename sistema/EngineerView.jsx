/* Interface 1 — Painel do Engenheiro (Operação).
   "Nova Proposta" abre o construtor por blocos (Composer). A tabela lista as
   propostas emitidas — registros travados: só status comercial + visualização. */

function EngineerView({ proposals, onStatusChange, onView, onNew, onEdit }) {
  return (
    <div className="flex flex-col gap-6">
      {/* action strip */}
      <div className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(120deg,#12161E,#0b0e14)', border: '1px solid rgba(225,177,79,0.18)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right,rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '34px 34px' }}></div>
        <div className="relative">
          <h2 className="font-[Outfit] font-bold text-white text-lg">Construa uma proposta de alto padrão</h2>
          <p className="text-sm mt-1 max-w-[440px]" style={{ color: T.fg2 }}>Monte o escopo bloco a bloco — itens, tabelas, cláusulas, cronograma e exclusões. Quase um contrato.</p>
        </div>
        <button onClick={onNew}
          className="relative flex items-center gap-2 font-semibold rounded-full px-6 py-3 text-sm whitespace-nowrap transition-all duration-300 hover:shadow-[0_0_22px_rgba(225,177,79,0.55)]"
          style={{ background: T.gold, color: T.s1 }}>
          <Icon name="file-plus" className="w-4 h-4" /> Nova Proposta
        </button>
      </div>

      {/* emitted table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-[Outfit] font-bold text-white text-lg">Propostas Emitidas</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: T.fg2 }}>{proposals.length}</span>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: T.fg3 }}>
            <Icon name="lock" className="w-3.5 h-3.5" /> Registros travados — somente status &amp; visualização
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-left" style={{ color: T.fg3 }}>
                <th className="font-medium text-xs uppercase tracking-wider px-6 py-3">Proposta</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3">Valor</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3">Andamento</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="text-white font-medium">{p.cliente || '(Sem Cliente)'}</div>
                    <div className="text-xs mt-0.5 flex items-center gap-x-2 gap-y-1 flex-wrap" style={{ color: T.fg3 }}>
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <ProposalCode code={p.id} />
                        <span>· {p.data}</span>
                      </span>
                      <ValidadeTag validade={p.validade} />
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top whitespace-nowrap text-white font-semibold">{BRL(proposalTotal(p))}</td>
                  <td className="px-4 py-4 align-top">
                    {p.draft
                      ? <StatusBadge status="Rascunho" />
                      : <StatusDropdown value={p.status} onChange={(s) => onStatusChange(p.id, s)} />}
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.draft
                        ? (
                          <button onClick={() => onEdit(p.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3.5 py-2 transition-all"
                            style={{ background: T.gold, color: T.s1 }}>
                            <Icon name="pencil" className="w-3.5 h-3.5" /> Continuar
                          </button>
                        )
                        : (
                          <React.Fragment>
                            <button onClick={() => onEdit(p.id)} title="Revisar proposta"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3.5 py-2 transition-all hover:border-[#E1B14F]"
                              style={{ color: T.gold, border: '1px solid rgba(225,177,79,0.3)' }}>
                              <Icon name="pencil" className="w-3.5 h-3.5" /> Revisar
                            </button>
                            <button onClick={() => onView(p.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-2 transition-all hover:bg-white/5"
                              style={{ color: T.fg2, border: '1px solid rgba(255,255,255,0.12)' }}>
                              <Icon name="eye" className="w-3.5 h-3.5" /> Ver
                            </button>
                          </React.Fragment>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {proposals.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-sm" style={{ color: T.fg3 }}>Nenhuma proposta emitida ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── ValidadeTag — gatilho de urgência: vermelho quando a validade venceu ── */
function ValidadeTag({ validade }) {
  if (!isoToDate(validade)) return null; // validade legada em texto: sem tag
  const exp = isExpired(validade);
  return (
    <span className="inline-flex items-center gap-1" style={{ color: exp ? '#f87171' : T.fg3 }}>
      <Icon name={exp ? 'alert-triangle' : 'calendar'} className="w-3 h-3" />
      {exp ? 'Vencida em ' : 'Válida até '}{fmtDateBR(validade)}
    </span>
  );
}

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null);
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const place = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const menuH = STATUS_KEYS.length * 38 + 8;
      const below = window.innerHeight - r.bottom;
      const openUp = below < menuH + 16 && r.top > below;
      setPos({
        left: r.left,
        top: openUp ? null : r.bottom + 6,
        bottom: openUp ? (window.innerHeight - r.top + 6) : null,
      });
    };
    place();
    const close = () => setOpen(false);
    const onDown = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      setOpen(false);
    };
    // fecha ao rolar (o menu é fixo e ficaria descolado da linha)
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <div className="relative">
      <button ref={btnRef} onClick={() => setOpen(!open)} className="flex items-center gap-1.5">
        <StatusBadge status={value} />
        <Icon name="chevron-down" className="w-3.5 h-3.5" style={{ color: T.fg3 }} />
      </button>
      {open && pos && (
        <div ref={menuRef} className="fixed z-[300] rounded-xl overflow-hidden py-1 min-w-[170px]"
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, background: T.s2, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.6)' }}>
          {STATUS_KEYS.map((s) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUSES[s].dot }}></span>
              <span className="text-sm" style={{ color: value === s ? '#fff' : T.fg2 }}>{s}</span>
              {value === s && <Icon name="check" className="w-3.5 h-3.5 ml-auto" style={{ color: T.gold }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { EngineerView });
