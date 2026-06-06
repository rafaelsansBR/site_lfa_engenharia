/* ClientsView — Micro-CRM. Lista a base de clientes (derivada das propostas)
   e abre uma gaveta lateral com LTV, última interação e histórico de propostas. */

function ClientsView({ proposals, onView, role, onDeleteClient }) {
  const clients = React.useMemo(() => deriveClients(proposals), [proposals]);
  const [openKey, setOpenKey] = React.useState(null);
  const [q, setQ] = React.useState('');

  const filtered = clients.filter((c) => {
    const s = (q || '').trim().toLowerCase();
    if (!s) return true;
    return (c.nome || '').toLowerCase().includes(s) || onlyDigits(c.cnpj).includes(onlyDigits(s));
  });
  const active = clients.find((c) => c.key === openKey) || null;

  const totalLTV = clients.reduce((a, c) => a + c.ltv, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPIc label="Clientes na base" value={clients.length} />
        <KPIc label="LTV consolidado" value={BRL(totalLTV)} accent="#3DBA7E" sub="Soma das propostas aprovadas" />
        <KPIc label="Propostas no sistema" value={proposals.length} />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-[Outfit] font-bold text-white text-lg">Base de Clientes</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: T.fg2 }}>{clients.length}</span>
          </div>
          <div className="relative">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.fg3 }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente…"
              className="bg-white/[0.04] border border-white/10 rounded-full pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-[#E1B14F] placeholder:text-gray-600 w-44 sm:w-56" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-left" style={{ color: T.fg3 }}>
                <th className="font-medium text-xs uppercase tracking-wider px-6 py-3">Cliente</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3">Origem</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3 whitespace-nowrap" style={{ color: '#3DBA7E' }}>LTV</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3">Propostas</th>
                <th className="font-medium text-xs uppercase tracking-wider px-4 py-3 whitespace-nowrap">Última interação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.key} onClick={() => setOpenKey(c.key)}
                  className="border-t border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer">
                  <td className="px-6 py-4 align-top">
                    <div className="text-white font-medium">{c.nome}</div>
                    <div className="text-xs mt-0.5" style={{ color: T.fg3 }}>{cpfCnpjLabel(c.cnpj)} {c.cnpj}</div>
                  </td>
                  <td className="px-4 py-4 align-top"><OriginTag origem={c.origem} /></td>
                  <td className="px-4 py-4 align-top whitespace-nowrap font-semibold" style={{ color: c.ltv > 0 ? '#3DBA7E' : T.fg3 }}>{BRL(c.ltv)}</td>
                  <td className="px-4 py-4 align-top">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: T.fg2 }}>{c.count}</span>
                  </td>
                  <td className="px-4 py-4 align-top whitespace-nowrap" style={{ color: T.fg2 }}>{c.ultima || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-sm" style={{ color: T.fg3 }}>Nenhum cliente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientDrawer client={active} onClose={() => setOpenKey(null)} onView={onView} role={role} onDeleteClient={onDeleteClient} />
    </div>
  );
}

function KPIc({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.fg3 }}>{label}</div>
      <div className="font-[Outfit] font-bold text-2xl" style={{ color: accent || '#fff' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: T.fg2 }}>{sub}</div>}
    </div>
  );
}

function ClientDrawer({ client, onClose, onView, role, onDeleteClient }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    if (client) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [client]);

  return (
    <div className={'fixed inset-0 z-[260] ' + (client ? '' : 'pointer-events-none')}>
      {/* backdrop */}
      <div onClick={onClose} className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(3,4,6,0.7)', backdropFilter: client ? 'blur(4px)' : 'none', opacity: client ? 1 : 0 }}></div>
      {/* painel */}
      <div className="absolute top-0 right-0 h-full w-full max-w-[460px] flex flex-col transition-transform duration-300"
        style={{ background: '#0C1016', borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-30px 0 60px -20px rgba(0,0,0,0.7)', transform: client ? 'translateX(0)' : 'translateX(100%)' }}>
        {client && (
          <React.Fragment>
            <div className="flex items-start justify-between gap-4 p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.fg3 }}>Cliente</div>
                <h2 className="font-[Outfit] font-bold text-white text-xl leading-tight">{client.nome}</h2>
                <div className="text-xs mt-1" style={{ color: T.fg2 }}>{cpfCnpjLabel(client.cnpj)} {client.cnpj}</div>
                <div className="mt-3"><OriginTag origem={client.origem} /></div>
              </div>
              <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: T.fg2 }}>
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-6 pb-0">
              <div className="rounded-xl p-4" style={{ background: 'rgba(61,186,126,0.08)', border: '1px solid rgba(61,186,126,0.25)' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.fg3 }}>LTV (aprovado)</div>
                <div className="font-[Outfit] font-bold text-xl" style={{ color: '#3DBA7E' }}>{BRL(client.ltv)}</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.fg3 }}>Última interação</div>
                <div className="font-[Outfit] font-bold text-xl text-white">{client.ultima || '—'}</div>
              </div>
            </div>

            <div className="px-6 pt-6 pb-2 flex items-center gap-2">
              <Icon name="history" className="w-4 h-4" style={{ color: T.gold }} />
              <span className="text-sm font-semibold text-white">Histórico de propostas</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: T.fg2 }}>{client.items.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-2.5">
              {client.items.map((p) => {
                const isDraft = p.draft;
                return (
                  <div key={p.id}
                    onClick={() => { if (!isDraft) onView(p.id); }}
                    className={'text-left rounded-xl p-3.5 transition-colors group ' + (isDraft ? 'cursor-default' : 'hover:bg-white/[0.03] cursor-pointer')}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', opacity: isDraft ? 0.72 : 1 }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs" style={{ color: T.fg3 }}>{p.id} · {p.data}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex items-end justify-between gap-3 mt-2">
                      <span className="font-[Outfit] font-bold text-white">{BRL(proposalTotal(p))}</span>
                      {isDraft
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: T.fg3 }}><Icon name="lock" className="w-3.5 h-3.5" /> Rascunho</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: T.gold }}>Ver <Icon name="arrow-right" className="w-3.5 h-3.5" /></span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {role === 'diretor' && (
              <div className="p-6 border-t border-white/5 flex gap-3 justify-end" style={{ background: '#090D12' }}>
                <button type="button" onClick={() => onDeleteClient(client)}
                  className="w-full flex items-center justify-center gap-2 font-semibold rounded-full py-3 text-sm transition-all duration-300 hover:bg-[rgba(248,113,113,0.08)]"
                  style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                  <Icon name="trash-2" className="w-4 h-4" /> Excluir Cliente
                </button>
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ClientsView });
