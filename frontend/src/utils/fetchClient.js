import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const REFRESH_URL = `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`;

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve());
  failedQueue = [];
};

async function doFetch(url, options, responseType) {
  const res = await fetch(url, options);

  if (res.status === 403) {
    let body;
    try { body = await res.clone().json(); } catch (_) {}

    if (body?.code === 'TOKEN_EXPIRED') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => doFetch(url, options, responseType));
      }

      isRefreshing = true;
      try {
        const refreshRes = await fetch(REFRESH_URL, { method: 'POST', credentials: 'include' });
        if (!refreshRes.ok) throw new Error('Refresh failed');
        processQueue(null);
        return doFetch(url, options, responseType);
      } catch (refreshErr) {
        processQueue(refreshErr);
        window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname);
        const err = new Error('Session expired');
        err.response = { data: null, status: 401 };
        throw err;
      } finally {
        isRefreshing = false;
      }
    }
  }

  if (!res.ok) {
    let errorData;
    try { errorData = await res.json(); } catch (_) {}
    const err = new Error(errorData?.error || res.statusText);
    err.response = { data: errorData, status: res.status };
    throw err;
  }

  if (responseType === 'blob') return { data: await res.blob() };
  if (res.status === 204) return { data: null };
  return { data: await res.json() };
}

function buildOptions(method, body, extraHeaders = {}) {
  const isFormData = body instanceof FormData;
  const { 'Content-Type': _ct, ...restHeaders } = extraHeaders;
  return {
    method,
    credentials: 'include',
    headers: isFormData
      ? restHeaders
      : { 'Content-Type': 'application/json', ...restHeaders },
    body: body == null
      ? undefined
      : isFormData ? body : JSON.stringify(body),
  };
}

function appendParams(url, params) {
  if (!params) return url;
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return url;
  return `${url}?${new URLSearchParams(entries).toString()}`;
}

const api = {
  get(url, config = {}) {
    return doFetch(appendParams(url, config.params), buildOptions('GET'), config.responseType);
  },
  post(url, body, config = {}) {
    return doFetch(url, buildOptions('POST', body, config.headers), config.responseType);
  },
  put(url, body, config = {}) {
    return doFetch(url, buildOptions('PUT', body, config.headers), config.responseType);
  },
  delete(url, config = {}) {
    return doFetch(url, buildOptions('DELETE', config.body, config.headers), config.responseType);
  },
};

export default api;
