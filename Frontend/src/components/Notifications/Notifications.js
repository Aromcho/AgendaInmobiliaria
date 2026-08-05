'use client';
import React from 'react';
import Icons from '../Icons/Icons';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/api';
import './Notifications.css';
/* Campanita de notificaciones + toasts -> window.Notifications */

const e = React.createElement;
const { useState, useRef, useEffect, useCallback } = React;
const I = Icons;

const POLL_MS = 10000;

function requestBrowserPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') Notification.requestPermission();
}

function pushBrowserNotification(item) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(item.title, {
      body: item.message || '',
      icon: '/logo.webp',
      tag: item._id,
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch { /* algunos navegadores mobile no soportan new Notification() en foreground */ }
}

function timeAgo(dateStr) {
  const min = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  return `hace ${Math.floor(hr / 24)} d`;
}

function NotificationBell({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const seenIds = useRef(null);

  const load = useCallback(() => {
    getNotifications().then((data) => {
      if (!data) return;
      const newItems = data.items || [];
      if (seenIds.current === null) {
        seenIds.current = new Set(newItems.map((it) => it._id));
      } else {
        newItems.forEach((it) => {
          if (!it.read && !seenIds.current.has(it._id)) {
            pushBrowserNotification(it);
          }
          seenIds.current.add(it._id);
        });
      }
      setItems(newItems);
      setUnreadCount(data.unreadCount || 0);
    });
  }, []);

  useEffect(() => {
    requestBrowserPermission();
    load();
    const id = setInterval(load, POLL_MS);
    const onOnline = () => load();
    window.addEventListener('online', onOnline);
    return () => { clearInterval(id); window.removeEventListener('online', onOnline); };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const h = (ev) => { if (ref.current && !ref.current.contains(ev.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const goTo = (item) => {
    if (item.tab && onNavigate) onNavigate(item.tab);
  };

  const onItemClick = async (item) => {
    if (!item.read) {
      await markNotificationRead(item._id);
      setItems((list) => list.map((it) => (it._id === item._id ? { ...it, read: true } : it)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    goTo(item);
  };

  const onMarkAll = async () => {
    await markAllNotificationsRead();
    setItems((list) => list.map((it) => ({ ...it, read: true })));
    setUnreadCount(0);
  };

  return e(React.Fragment, null,
    e('div', { className: 'notif-wrap', ref },
      e('button', { className: 'icon-btn' + (unreadCount ? ' on' : ''), onClick: () => setOpen((o) => !o), title: 'Notificaciones' },
        e(I.Bell, { width: 17, height: 17 }),
        unreadCount ? e('span', { className: 'notif-badge' }, unreadCount > 9 ? '9+' : unreadCount) : null,
      ),
      open ? e('div', { className: 'notif-pop' },
        e('div', { className: 'notif-head' },
          e('span', null, 'Notificaciones'),
          unreadCount ? e('button', { className: 'notif-markall', onClick: onMarkAll }, 'Marcar todas leídas') : null,
        ),
        e('div', { className: 'notif-list' },
          items.length
            ? items.map((item) => e('button', {
                key: item._id,
                className: 'notif-item' + (item.read ? '' : ' unread'),
                onClick: () => onItemClick(item),
              },
                e('span', { className: 'notif-dot', style: item.color ? { background: item.read ? 'transparent' : item.color } : null }),
                e('div', { className: 'notif-body' },
                  e('span', { className: 'notif-title' }, item.title),
                  item.message ? e('span', { className: 'notif-msg' }, item.message) : null,
                  e('span', { className: 'notif-time' }, timeAgo(item.createdAt)),
                ),
              ))
            : e('div', { className: 'notif-empty' }, 'No hay notificaciones.'),
        ),
      ) : null,
    ),
  );
}

export { NotificationBell };
export default NotificationBell;
