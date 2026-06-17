'use client';
import React from 'react';
import Icons from '../Icons/Icons';
import './Users.css';
import { createResource, deleteResource, fetchCollection, updateResource } from '@/services/api';
/* Dashboard simple de gestión de usuarios -> solo SUPER_ADMIN */

const e = React.createElement;
const { useState, useEffect } = React;
const I = Icons;

function UsuariosView() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [error, setError] = useState('');

  const load = () => fetchCollection('users').then((list) => setUsers(list || []));
  useEffect(() => { load(); }, []);

  const set = (k) => (ev) => setForm((o) => ({ ...o, [k]: ev.target.value }));

  async function submit(ev) {
    ev.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Completá nombre, email y contraseña.');
      return;
    }
    const created = await createResource('users', form);
    if (!created) { setError('No se pudo crear el usuario.'); return; }
    setForm({ name: '', email: '', password: '', role: 'USER' });
    load();
  }

  async function remove(id) {
    await deleteResource('users', id);
    load();
  }

  async function changeRole(id, role) {
    const updated = await updateResource('users', id, { role });
    if (!updated) return;
    setUsers((list) => list.map((u) => (u._id === id ? { ...u, role } : u)));
  }

  return e('div', { className: 'view-card users-card' },
    e('h2', { className: 'tb-title', style: { marginBottom: 14 } }, 'Gestión de usuarios'),
    e('form', { className: 'users-form', onSubmit: submit },
      e('input', { value: form.name, onChange: set('name'), placeholder: 'Nombre' }),
      e('input', { value: form.email, onChange: set('email'), placeholder: 'Email', type: 'email' }),
      e('input', { value: form.password, onChange: set('password'), placeholder: 'Contraseña', type: 'password' }),
      e('select', { value: form.role, onChange: set('role') },
        e('option', { value: 'USER' }, 'Usuario'),
        e('option', { value: 'ADMIN' }, 'Admin'),
        e('option', { value: 'SUPER_ADMIN' }, 'Super admin'),
      ),
      e('button', { className: 'btn primary', type: 'submit' }, e(I.Plus, { width: 16, height: 16 }), 'Crear usuario'),
    ),
    error ? e('p', { style: { color: '#9c2e2a' } }, error) : null,
    e('div', { className: 'users-list' },
      users.map((u) => e('div', { className: 'users-row', key: u._id },
        e('div', null,
          e('b', null, u.name), ' ',
          e('span', { className: 'd-muted' }, u.email)),
        e('select', { className: 'role-select', value: u.role, onChange: (ev) => changeRole(u._id, ev.target.value) },
          e('option', { value: 'USER' }, 'Usuario'),
          e('option', { value: 'ADMIN' }, 'Admin'),
          e('option', { value: 'SUPER_ADMIN' }, 'Super admin'),
        ),
        e('button', { className: 'btn ghost danger sm', onClick: () => remove(u._id) }, e(I.Trash, { width: 14, height: 14 }), 'Eliminar'),
      )),
    ),
  );
}

export { UsuariosView };
