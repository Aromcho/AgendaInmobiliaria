'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Acceso from '@/components/Acceso/Acceso';
import { getSession, login as apiLogin, setUnauthorizedHandler } from '@/services/api';

const CalendarApp = dynamic(() => import('@/components/CalendarApp/CalendarApp'), { ssr: false });

export default function Page() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false });
  const [authError, setAuthError] = useState('');

  // Registrar handler global: si cualquier request recibe 401, fuerza logout
  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null));
  }, []);

  // Verificar sesión existente al arrancar
  useEffect(() => {
    let active = true;
    getSession().then((result) => {
      if (!active) return;
      if (result?.online) setSession(result.user || result);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setBackendDown(true);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthError('');

    const result = await apiLogin(loginForm.email, loginForm.password);
    if (!result) {
      setAuthError('No se pudo conectar con el servidor. Verificá tu conexión.');
      return;
    }

    const online = await getSession();
    if (online?.online) {
      setSession(online.user || online);
      return;
    }

    setAuthError('Credenciales incorrectas.');
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
        bootError={backendDown ? 'El servidor no responde. Verificá que el backend esté corriendo.' : ''}
      />
    );
  }

  return <CalendarApp onLogout={handleLogout} session={session} />;
}
