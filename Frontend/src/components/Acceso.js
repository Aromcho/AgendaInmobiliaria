'use client';

import { CAL } from '@/lib/data';

export default function Acceso({ loginForm, setLoginForm, onSubmit, authError, bootError }) {
  const set = (key) => (ev) => {
    const value = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
    setLoginForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="acceso-root">
      <div className="bg" />
      <div className="bg-tint" />

      <div className="stage">
        <div className="hero">
          <span className="hero-badge"><span className="dot" />Temporada 2026 · Costa Atlántica</span>
          <h1>La agenda de tu inmobiliaria, <em>siempre a mano.</em></h1>
          <p>Reservas, visitas, vencimientos y mantenimiento de todas tus propiedades, en un solo calendario.</p>
          <div className="hero-stats">
            <div className="hstat"><b>{CAL.PROPERTIES.length}</b><span>Propiedades</span></div>
            <div className="hstat"><b>{CAL.AGENTS.length}</b><span>Integrantes</span></div>
            <div className="hstat"><b>{CAL.EVENTS.length}</b><span>Eventos del mes</span></div>
          </div>
        </div>

        <form className="login-card" onSubmit={onSubmit}>
          <div className="card-logo"><img src="/logo.webp" alt="Inmobiliaria Silvia Fernández" /></div>
          <div className="card-sub">Gestor de calendario</div>
          <h2>Bienvenida de nuevo</h2>
          <p className="card-lead">Ingresá para ver la agenda del equipo.</p>

          {bootError ? <p className="card-lead" style={{ color: '#9c2e2a' }}>{bootError}</p> : null}

          <div className="acceso-fg">
            <label htmlFor="email">Correo</label>
            <input id="email" type="email" placeholder="silvia@inmobiliariasf.com.ar" value={loginForm.email} onChange={set('email')} />
          </div>
          <div className="acceso-fg">
            <label htmlFor="pass">Contraseña</label>
            <input id="pass" type="password" placeholder="••••••••" value={loginForm.password} onChange={set('password')} />
          </div>
          <div className="row-between">
            <label className="remember"><input type="checkbox" checked={loginForm.remember} onChange={set('remember')} /> Recordarme</label>
            <a className="link" href="#">¿Olvidaste tu clave?</a>
          </div>

          {authError ? <p className="card-lead" style={{ color: '#9c2e2a' }}>{authError}</p> : null}

          <button className="enter-btn" type="submit">
            Entrar al calendario
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>
          </button>

          <div className="card-foot">¿Sos parte del equipo y no tenés acceso? <a href="#">Solicitalo acá</a></div>
        </form>
      </div>
    </div>
  );
}
