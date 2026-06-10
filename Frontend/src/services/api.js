const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001/api';

async function requestJSON(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const error = new Error(data?.message || 'Request failed');
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  } catch (error) {
    return null;
  }
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

export async function fetchCollection(resource) {
  return requestJSON(`/${resource}`);
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