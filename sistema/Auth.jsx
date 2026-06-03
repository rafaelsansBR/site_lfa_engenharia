/* Auth — Login corporativo + sessão via Supabase Auth.
   ┌──────────────────────────────────────────────────────────────────┐
   │  🔒 MIGRAÇÃO DE SEGURANÇA                                       │
   │  ANTES: senhas em texto plano no código-fonte (USERS array).    │
   │  DEPOIS: Supabase Auth (bcrypt + JWT) — zero credenciais no     │
   │  frontend. O role vem do banco (profiles.role), não do client.  │
   └──────────────────────────────────────────────────────────────────┘ */

/* ── Login Screen ────────────────────────────────────────────────── */
function Login({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [err, setErr] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e) => {
    if (e) e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!mail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { setErr('Informe um e-mail válido.'); return; }
    if (!senha) { setErr('Informe sua senha.'); return; }

    setLoading(true);
    setErr('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: senha,
      });
      if (error) {
        setErr(error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message);
        setLoading(false);
        return;
      }
      // Busca perfil do banco (role, nome, tenant)
      const profile = await sbGetProfile();
      if (!profile) {
        setErr('Perfil não encontrado. Contate o administrador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      onLogin({
        email: profile.email,
        role: profile.role === 'director' ? 'diretor' : 'engenheiro',
        nome: profile.full_name || mail.split('@')[0],
        _profileId: profile.id,
        _tenantId: profile.tenant_id,
      });
    } catch (ex) {
      setErr('Erro de conexão. Tente novamente.');
      console.error('Login error:', ex);
    }
    setLoading(false);
  };

  const field = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#E1B14F] placeholder:text-gray-600';

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden" style={{ background: '#05070a' }}>
      {/* fundo: imagem hero + scrim + grid */}
      <div className="absolute inset-0" style={{ backgroundImage: 'url(assets/site-hero.webp)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }}></div>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(225,177,79,0.10), transparent 60%), linear-gradient(180deg, rgba(5,7,10,0.82) 0%, rgba(5,7,10,0.92) 55%, #05070a 100%)' }}></div>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(circle at 50% 40%, #000, transparent 75%)' }}></div>

      <div className="relative w-full max-w-[400px]">
        {/* marca */}
        <div className="flex flex-col items-center mb-8">
          <img src="assets/lfa-logo-horizontal-negativo.png" alt="LFA Engenharia" style={{ height: 64, width: 'auto' }} />
          <div className="text-[11px] tracking-wider mt-3" style={{ color: T.fg3 }}>SISTEMA DE PROPOSTAS PROFISSIONAIS</div>
        </div>

        <form onSubmit={submit} className="rounded-2xl p-7" style={{ background: 'rgba(18,22,30,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px -24px rgba(0,0,0,0.7)' }}>
          <h1 className="font-[Outfit] font-bold text-white text-xl">Acesse sua conta</h1>
          <p className="text-sm mt-1 mb-6" style={{ color: T.fg2 }}>Entre para gerenciar propostas e o pipeline comercial.</p>

          <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: T.fg2 }}>E-mail</label>
          <input className={field + ' mb-4'} type="email" autoComplete="username" value={email}
            onChange={(e) => { setEmail(e.target.value); setErr(''); }} placeholder="voce@lfaengenharia.com" disabled={loading} />

          <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: T.fg2 }}>Senha</label>
          <div className="relative mb-2">
            <input className={field + ' pr-11'} type={show ? 'text' : 'password'} autoComplete="current-password" value={senha}
              onChange={(e) => { setSenha(e.target.value); setErr(''); }} placeholder="••••••••" disabled={loading} />
            <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
              <Icon name={show ? 'eye-off' : 'eye'} className="w-4 h-4" style={{ color: T.fg2 }} />
            </button>
          </div>

          {err && <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: '#f87171' }}><Icon name="alert-circle" className="w-3.5 h-3.5" /> {err}</div>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 font-semibold rounded-full px-6 py-3 text-sm mt-3 transition-all duration-300 hover:shadow-[0_0_22px_rgba(225,177,79,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: T.gold, color: T.s1 }}>
            {loading ? 'Entrando…' : 'Entrar'} <Icon name={loading ? 'loader-2' : 'arrow-right'} className={'w-4 h-4' + (loading ? ' animate-spin' : '')} />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Settings Modal (Alterar Senha) ─────────────────────────────── */
function SettingsModal({ open, onClose }) {
  const [newPass, setNewPass] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState(null); // { type: 'ok'|'err', text }

  React.useEffect(() => {
    if (open) { setNewPass(''); setConfirm(''); setMsg(null); setShowPass(false); }
  }, [open]);

  const minLen = 8;
  const passOk = newPass.length >= minLen;
  const match = newPass === confirm && confirm.length > 0;
  const canSubmit = passOk && match && !loading;

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) {
        setMsg({ type: 'err', text: error.message });
      } else {
        setMsg({ type: 'ok', text: 'Senha atualizada com sucesso!' });
        setTimeout(() => onClose(), 2000);
      }
    } catch (ex) {
      setMsg({ type: 'err', text: 'Erro de conexão. Tente novamente.' });
    }
    setLoading(false);
  };

  if (!open) return null;
  const field = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#E1B14F] placeholder:text-gray-600';

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: 'rgba(3,4,6,0.8)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-7"
        style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(225,177,79,0.12)', border: '1px solid rgba(225,177,79,0.3)' }}>
            <Icon name="shield-check" className="w-5 h-5" style={{ color: T.gold }} />
          </div>
          <div>
            <h3 className="font-[Outfit] font-bold text-white text-lg">Alterar Senha</h3>
            <p className="text-xs" style={{ color: T.fg3 }}>Segurança da sua conta</p>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: T.fg2 }}>Nova senha</label>
            <div className="relative">
              <input className={field + ' pr-11'} type={showPass ? 'text' : 'password'} value={newPass}
                onChange={(e) => { setNewPass(e.target.value); setMsg(null); }} placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={() => setShowPass((s) => !s)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                <Icon name={showPass ? 'eye-off' : 'eye'} className="w-4 h-4" style={{ color: T.fg2 }} />
              </button>
            </div>
            {newPass && !passOk && (
              <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: '#f87171' }}>
                <Icon name="alert-circle" className="w-3 h-3" /> Mínimo {minLen} caracteres
              </div>
            )}
            {passOk && (
              <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: T.gold }}>
                <Icon name="check" className="w-3 h-3" /> Tamanho válido
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: T.fg2 }}>Confirmar nova senha</label>
            <input className={field} type={showPass ? 'text' : 'password'} value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setMsg(null); }} placeholder="Repita a nova senha" />
            {confirm && !match && (
              <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: '#f87171' }}>
                <Icon name="alert-circle" className="w-3 h-3" /> As senhas não coincidem
              </div>
            )}
            {match && (
              <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: '#3DBA7E' }}>
                <Icon name="check" className="w-3 h-3" /> Senhas coincidem
              </div>
            )}
          </div>

          {msg && (
            <div className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-2"
              style={msg.type === 'ok'
                ? { color: '#3DBA7E', background: 'rgba(61,186,126,0.1)', border: '1px solid rgba(61,186,126,0.3)' }
                : { color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
              <Icon name={msg.type === 'ok' ? 'check-circle' : 'alert-circle'} className="w-3.5 h-3.5 shrink-0" />
              {msg.text}
            </div>
          )}

          <div className="flex gap-3 justify-end mt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-full text-sm font-medium transition-colors hover:text-white"
              style={{ color: T.fg2, border: '1px solid rgba(255,255,255,0.15)' }}>Cancelar</button>
            <button type="submit" disabled={!canSubmit}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_22px_rgba(225,177,79,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: T.gold, color: T.s1 }}>
              {loading ? 'Salvando…' : 'Atualizar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { Login, SettingsModal });
