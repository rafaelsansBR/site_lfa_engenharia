/* Interface 2 — Painel do Diretor (Gestão e Inteligência).
   Read-only mirror of the engineer's proposals + intelligence KPIs +
   exclusive "Comissão Projetada" column + master delete (lixeira). */

function KPI({ label, value, sub, accent, icon }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.fg3 }}>{label}</div>
        {icon && <Icon name={icon} className="w-4 h-4" style={{ color: accent || T.fg3 }} />}
      </div>
      <div className="font-[Outfit] font-bold text-2xl" style={{ color: accent || '#fff' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: T.fg2 }}>{sub}</div>}
    </div>
  );
}

function DirectorView({ proposals, onDelete, onView, onEdit }) {
  const emitted = proposals.filter((p) => !p.draft);
  const pipeline = emitted.reduce((a, p) => a + proposalTotal(p), 0);
  const approved = emitted.filter((p) => p.status === 'Aprovado').reduce((a, p) => a + proposalTotal(p), 0);
  const realizada = commissionRealizada(proposals);
  const projetada = commissionProjetada(proposals);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Comissão Realizada" value={BRL(realizada)} sub="25% · elegíveis aprovadas" accent="#3DBA7E" icon="badge-check" />
        <KPI label="Comissão Projetada" value={BRL(projetada)} sub="25% · elegíveis em aberto" accent={T.gold} icon="trending-up" />
        <KPI label="Valor Aprovado" value={BRL(approved)} sub="Receita fechada" />
        <KPI label="Pipeline Total" value={BRL(pipeline)} sub={`${emitted.length} propostas emitidas`} />
      </div>

      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(225,177,79,0.05)', border: '1px solid rgba(225,177,79,0.18)' }}>
        <Icon name="info" className="w-4 h-4 mt-0.5 shrink-0" style={{ color: T.gold }} />
        <p className="text-xs leading-relaxed" style={{ color: T.fg2 }}>
          A comissão de <b className="text-white">25%</b> incide apenas sobre leads de <b style={{ color: T.gold }}>aquisição</b> (Site, Instagram, Indicação Rafael). Leads <b className="text-white">orgânicos</b> e propostas <b className="text-white">perdidas</b> não geram comissão.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-[Outfit] font-bold text-white text-lg">Visão Global — Propostas</h2>
            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.06)', color: T.fg2 }}>
              <Icon name="eye" className="w-3 h-3" /> Read-only
            </span>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: T.fg3 }}>
            <Icon name="shield" className="w-3.5 h-3.5" style={{ color: T.gold }} /> Controle master
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-left" style={{ color: T.fg3 }}>
                <th className="font-medium text-xs uppercase tracking-wider px-6 py-3">Proposta</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3">Origem</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3">Valor Total</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3 whitespace-nowrap" style={{ color: T.gold }}>Comissão</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3">Status</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {emitted.map((p) => {
                const c = commissionFor(p);
                const realized = p.status === 'Aprovado';
                const projected = p.status === 'Enviado' || p.status === 'Em Negociação';
                const counts = c > 0 && (realized || projected);
                return (
                  <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="text-white font-medium">{p.cliente || '(Sem Cliente)'}</div>
                      <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: T.fg3 }}>
                        <ProposalCode code={p.id} />
                        {p.cnpj && <span>· {p.cnpj}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top"><OriginTag origem={p.origem} /></td>
                    <td className="px-4 py-4 align-top whitespace-nowrap text-white font-semibold">{BRL(proposalTotal(p))}</td>
                    <td className="px-4 py-4 align-top whitespace-nowrap font-semibold">
                      {c > 0
                        ? <span style={{ color: counts ? (realized ? '#3DBA7E' : T.gold) : T.fg3, textDecoration: counts ? 'none' : 'line-through' }}>{BRL(c)}</span>
                        : <span style={{ color: T.fg3 }}>—</span>}
                    </td>
                    <td className="px-4 py-4 align-top"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onView(p.id)} title="Ver Proposta"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: T.fg2 }}>
                          <Icon name="eye" className="w-4 h-4" />
                        </button>
                        <button onClick={() => onEdit(p.id)} title="Editar Proposta"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: T.fg2 }}>
                          <Icon name="pencil" className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(p)} title="Excluir registro"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(248,113,113,0.12)]" style={{ color: T.fg3 }}>
                          <Icon name="trash-2" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {emitted.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-sm" style={{ color: T.fg3 }}>Sem registros emitidos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DirectorView });
