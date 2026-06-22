'use client';
import React from 'react';
import Icons from '../Icons/Icons';
import * as UI from '../UI/UI';
import { useIsMobile } from '@/lib/useIsMobile';
import './Users.css';
import { createResource, deleteResource, fetchCollection, updateResource } from '@/services/api';
/* Dashboard simple de gestión de usuarios -> solo SUPER_ADMIN */

const e = React.createElement;
const { useState, useEffect } = React;
const I = Icons;
const { ProfileAvatar } = UI;

const ROLE_LABEL = { USER: 'Usuario', ADMIN: 'Admin', SUPER_ADMIN: 'Super admin' };
const RoleOptions = () => [
  e('option', { key: 'u', value: 'USER' }, 'Usuario'),
  e('option', { key: 'a', value: 'ADMIN' }, 'Admin'),
  e('option', { key: 's', value: 'SUPER_ADMIN' }, 'Super admin'),
];

function NewUserForm({ form, set, error, onSubmit }) {
  return e('form', { className: 'users-form', onSubmit },
    e('input', { value: form.name, onChange: set('name'), placeholder: 'Nombre' }),
    e('input', { value: form.email, onChange: set('email'), placeholder: 'Email', type: 'email' }),
    e('input', { value: form.password, onChange: set('password'), placeholder: 'Contraseña', type: 'password' }),
    e('select', { value: form.role, onChange: set('role') }, RoleOptions()),
    error ? e('p', { className: 'users-error' }, error) : null,
    e('button', { className: 'btn primary', type: 'submit' }, e(I.Plus, { width: 16, height: 16 }), 'Crear usuario'),
  );
}

// ---------- Tarjeta tipo directorio (mobile): avatar + nombre + rol + chevron ----------
function UserCardMobile({ u, onTap }) {
  return e('button', { className: 'um-card', onClick: () => onTap(u) },
    e(ProfileAvatar, { email: u.email, name: u.name, size: 40 }),
    e('div', { className: 'um-main' },
      e('div', { className: 'um-name' }, u.name),
      e('div', { className: 'um-role' }, ROLE_LABEL[u.role] || u.role),
    ),
    e('span', { className: 'um-chev' }, e(I.Chevron, { width: 17, height: 17 })),
  );
}

// ---------- Hoja de acciones (mobile): cambiar rol / eliminar ----------
function UserActionSheet({ user, onClose, onChangeRole, onRemove }) {
  if (!user) return null;
  return e('div', { className: 'modal-scrim', onMouseDown: onClose },
    e('div', { className: 'detail overdue-modal', onMouseDown: (ev) => ev.stopPropagation() },
      e('div', { className: 'detail-top', style: { background: 'linear-gradient(135deg, var(--green-700), var(--green-900))' } },
        e('span', { className: 'detail-deco' }),
        e('span', { className: 'detail-type' }, e(ProfileAvatar, { email: user.email, name: user.name, size: 18 }), user.name),
        e('button', { className: 'detail-x', onClick: onClose }, e(I.Close, { width: 18, height: 18 })),
      ),
      e('div', { className: 'detail-body' },
        e('div', { className: 'fg' },
          e('label', null, 'Rol'),
          e('select', { className: 'role-select', value: user.role, onChange: (ev) => onChangeRole(user._id, ev.target.value) }, RoleOptions()),
        ),
        e('button', {
          className: 'btn ghost danger', style: { marginTop: 14, width: '100%', justifyContent: 'center' },
          onClick: () => { onRemove(user._id); onClose(); },
        }, e(I.Trash, { width: 16, height: 16 }), 'Eliminar usuario'),
      ),
    ),
  );
}

function UsuariosView() {
  const isMobile = useIsMobile();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [actingOn, setActingOn] = useState(null);

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
    setShowForm(false);
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
    setActingOn((u) => (u && u._id === id ? { ...u, role } : u));
  }

  if (isMobile) {
    return e(React.Fragment, null,
      e('div', { className: 'view-card users-card-mobile' },
        e('div', { className: 'um-head' },
          e('h2', { className: 'tb-title' }, 'Equipo'),
          e('button', { className: 'icon-btn on', onClick: () => setShowForm(true), title: 'Nuevo usuario' }, e(I.Plus, { width: 18, height: 18 })),
        ),
        e('div', { className: 'um-list' },
          users.map((u) => e(UserCardMobile, { key: u._id, u, onTap: setActingOn })),
        ),
      ),
      showForm ? e('div', { className: 'modal-scrim', onMouseDown: () => setShowForm(false) },
        e('div', { className: 'form', onMouseDown: (ev) => ev.stopPropagation() },
          e('div', { className: 'form-head' },
            e('h2', null, 'Nuevo usuario'),
            e('button', { className: 'detail-x dark', onClick: () => setShowForm(false) }, e(I.Close, { width: 18, height: 18 })),
          ),
          e('div', { className: 'form-body' }, e(NewUserForm, { form, set, error, onSubmit: submit })),
        ),
      ) : null,
      e(UserActionSheet, { user: actingOn, onClose: () => setActingOn(null), onChangeRole: changeRole, onRemove: remove }),
    );
  }

  return e('div', { className: 'view-card users-card' },
    e('h2', { className: 'tb-title', style: { marginBottom: 14 } }, 'Gestión de usuarios'),
    e(NewUserForm, { form, set, error, onSubmit: submit }),
    e('div', { className: 'users-list' },
      users.map((u) => e('div', { className: 'users-row', key: u._id },
        e('div', { className: 'users-row-id' },
          e(ProfileAvatar, { email: u.email, name: u.name, size: 32 }),
          e('div', null,
            e('b', null, u.name), ' ',
            e('span', { className: 'd-muted' }, u.email))),
        e('select', { className: 'role-select', value: u.role, onChange: (ev) => changeRole(u._id, ev.target.value) }, RoleOptions()),
        e('button', { className: 'btn ghost danger sm', onClick: () => remove(u._id) }, e(I.Trash, { width: 14, height: 14 }), 'Eliminar'),
      )),
    ),
  );
}

export { UsuariosView };
