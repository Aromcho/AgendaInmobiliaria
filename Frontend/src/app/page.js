'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Acceso from '@/components/Acceso';
import { INITIAL_SESSION, SUPER_USER } from '@/data/seed';
import { getSession, login as apiLogin } from '@/services/api';

const CalendarApp = dynamic(() => import('@/components/CalendarApp'), { ssr: false });

function initLogin() {
  return { email: SUPER_USER.email, password: SUPER_USER.password, remember: true };
}

export default function Page() {
  const [session, setSession] = useState(INITIAL_SESSION);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState('');
  const [loginForm, setLoginForm] = useState(initLogin);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;

    async function boot() {
      const online = await getSession();
      if (!active) return;
      if (online?.online) setSession(online.user || online);
      setLoading(false);
    }

    boot().catch(() => {
      if (!active) return;
      setBootError('El backend todavía no responde. La interfaz seguirá con los datos semilla.');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthError('');

    const remote = await apiLogin(loginForm.email, loginForm.password).catch(() => null);
    const online = await getSession().catch(() => null);

    if (online?.online) {
      setSession(online.user || online);
      return;
    }

    if (remote?.online || remote?.token) {
      setSession(remote.user || { email: loginForm.email, role: 'USER', name: loginForm.email });
      return;
    }

    if (loginForm.email === SUPER_USER.email && loginForm.password === SUPER_USER.password) {
      setSession({ online: true, user: { email: SUPER_USER.email, name: SUPER_USER.name, role: SUPER_USER.role } });
      return;
    }

    setAuthError('No se pudo iniciar sesión. Verificá el backend o las credenciales.');
  }

  function handleLogout() {
    setSession(null);
  }

  if (loading) {
    return (
      <div className="acceso-root">
        <div className="bg" />
        <div className="bg-tint" />
        <div className="stage" style={{ justifyContent: 'center' }}>
          <div className="login-card" style={{ textAlign: 'center' }}>
            <div className="card-logo"><img src="/logo.webp" alt="Inmobiliaria Silvia Fernández" /></div>
            <div className="card-sub">Gestor de calendario</div>
            <h2>Cargando agenda…</h2>
            <p className="card-lead">Preparando calendario, tareas y recepción.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Acceso
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        onSubmit={handleLogin}
        authError={authError}
        bootError={bootError}
      />
    );
  }

  return <CalendarApp onLogout={handleLogout} />;
}
