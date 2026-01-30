const getAuthToken = () => localStorage.getItem('authToken');
const runtimeEnv = typeof window !== 'undefined' ? window.__ENV__ || {} : {};

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  const trimmed = value.trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL || runtimeEnv.VITE_API_URL || ''
);

export const apiFetch = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE_URL}${path}`;

  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = options.signal ? null : new AbortController();
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller?.signal,
    });

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || 'Request failed';
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};
