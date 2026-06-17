const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001/api';

let _onUnauthorized = null;
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn; }

async function requestJSON(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch {
    return null; // error de red
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (response.status === 401) {
    if (_onUnauthorized) _onUnauthorized();
    return null;
  }

  if (!response.ok) return null;

  return data;
}

export async function getSession() {
  return requestJSON('/sessions/online');
}

export async function login(email, password) {
  return requestJSON('/sessions/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return requestJSON('/sessions/logout', { method: 'DELETE' });
}

export async function fetchCollection(resource, params) {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  return requestJSON(`/${resource}${qs}`);
}

export async function getLinkPreview(url) {
  return requestJSON(`/link-preview?${new URLSearchParams({ url }).toString()}`);
}

export async function getNotifications() {
  return requestJSON('/notifications');
}

export async function markNotificationRead(id) {
  return requestJSON(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllNotificationsRead() {
  return requestJSON('/notifications/read-all', { method: 'PUT' });
}

export async function createResource(resource, payload) {
  return requestJSON(`/${resource}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateResource(resource, id, payload) {
  return requestJSON(`/${resource}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteResource(resource, id) {
  return requestJSON(`/${resource}/${id}`, {
    method: 'DELETE',
  });
}

export { API_BASE };