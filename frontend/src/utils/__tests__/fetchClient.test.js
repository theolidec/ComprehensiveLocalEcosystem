import api from '../fetchClient';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

const REFRESH_URL = `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`;

const jsonResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: 'OK',
  json: async () => data,
  clone() { return this; },
});

const errorResponse = (data, status, statusText = 'Error') => ({
  ok: false,
  status,
  statusText,
  json: async () => data,
  clone() { return this; },
});

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('api.get', () => {
  it('sends a credentialed JSON GET and unwraps the body', async () => {
    fetch.mockResolvedValue(jsonResponse({ items: [1, 2] }));

    const result = await api.get('/api/things');

    expect(result).toEqual({ data: { items: [1, 2] } });
    expect(fetch).toHaveBeenCalledWith('/api/things', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: undefined,
    });
  });

  it('appends query params, skipping null and empty values', async () => {
    fetch.mockResolvedValue(jsonResponse({}));

    await api.get('/api/things', { params: { page: 2, q: 'a b', empty: '', missing: null, zero: 0 } });

    expect(fetch.mock.calls[0][0]).toBe('/api/things?page=2&q=a+b&zero=0');
  });

  it('leaves the url untouched when there are no usable params', async () => {
    fetch.mockResolvedValue(jsonResponse({}));

    await api.get('/api/things', { params: { a: null } });
    expect(fetch.mock.calls[0][0]).toBe('/api/things');

    await api.get('/api/things');
    expect(fetch.mock.calls[1][0]).toBe('/api/things');
  });

  it('returns a blob when responseType is blob', async () => {
    const blob = new Blob(['file']);
    fetch.mockResolvedValue({ ok: true, status: 200, blob: async () => blob, clone() { return this; } });

    await expect(api.get('/api/files/1', { responseType: 'blob' })).resolves.toEqual({ data: blob });
  });

  it('returns null data for 204 responses', async () => {
    fetch.mockResolvedValue({ ok: true, status: 204, clone() { return this; } });

    await expect(api.get('/api/things')).resolves.toEqual({ data: null });
  });
});

describe('api.post / put / delete', () => {
  it('serialises JSON bodies', async () => {
    fetch.mockResolvedValue(jsonResponse({ id: 1 }));

    await api.post('/api/things', { name: 'thing' });

    expect(fetch).toHaveBeenCalledWith('/api/things', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'thing' }),
    });
  });

  it('lets FormData set its own Content-Type', async () => {
    fetch.mockResolvedValue(jsonResponse({}));
    const form = new FormData();
    form.append('file', 'x');

    await api.post('/api/upload', form, { headers: { 'Content-Type': 'text/plain', 'X-Extra': '1' } });

    const options = fetch.mock.calls[0][1];
    expect(options.headers).toEqual({ 'X-Extra': '1' });
    expect(options.body).toBe(form);
  });

  it('merges extra headers for JSON bodies', async () => {
    fetch.mockResolvedValue(jsonResponse({}));

    await api.put('/api/things/1', { name: 'x' }, { headers: { 'X-Extra': '1' } });

    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Extra': '1' },
      body: JSON.stringify({ name: 'x' }),
    });
  });

  it('omits the body when none is given', async () => {
    fetch.mockResolvedValue(jsonResponse({}));

    await api.delete('/api/things/1');

    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'DELETE', body: undefined });
  });

  it('sends a body on delete when configured', async () => {
    fetch.mockResolvedValue(jsonResponse({}));

    await api.delete('/api/things/1', { body: { reason: 'cleanup' } });

    expect(fetch.mock.calls[0][1].body).toBe(JSON.stringify({ reason: 'cleanup' }));
  });
});

describe('error handling', () => {
  it('throws an error carrying the parsed response', async () => {
    fetch.mockResolvedValue(errorResponse({ error: 'Not found' }, 404));

    await expect(api.get('/api/things/404')).rejects.toMatchObject({
      message: 'Not found',
      response: { status: 404, data: { error: 'Not found' } },
    });
  });

  it('falls back to the status text when the body is not JSON', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => { throw new Error('not json'); },
      clone() { return this; },
    });

    await expect(api.get('/api/things')).rejects.toMatchObject({
      message: 'Internal Server Error',
      response: { status: 500, data: undefined },
    });
  });

  it('does not attempt a refresh for a 403 that is not TOKEN_EXPIRED', async () => {
    fetch.mockResolvedValue(errorResponse({ error: 'Forbidden', code: 'FORBIDDEN' }, 403));

    await expect(api.get('/api/things')).rejects.toMatchObject({
      response: { status: 403 },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalledWith(REFRESH_URL, expect.anything());
  });
});

describe('token refresh', () => {
  it('refreshes once and replays the original request on TOKEN_EXPIRED', async () => {
    fetch
      .mockResolvedValueOnce(errorResponse({ code: 'TOKEN_EXPIRED' }, 403))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}), clone() { return this; } })
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await expect(api.get('/api/things')).resolves.toEqual({ data: { ok: true } });

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[1]).toEqual([REFRESH_URL, { method: 'POST', credentials: 'include' }]);
    expect(fetch.mock.calls[2][0]).toBe('/api/things');
  });

  it('queues concurrent requests so only one refresh is issued', async () => {
    let releaseRefresh;
    const refreshGate = new Promise((resolve) => { releaseRefresh = resolve; });

    fetch.mockImplementation((url) => {
      if (url === REFRESH_URL) {
        return refreshGate.then(() => ({ ok: true, status: 200, json: async () => ({}), clone() { return this; } }));
      }
      const call = fetch.mock.calls.filter(([u]) => u === url).length;
      // First attempt per url expires, later attempts succeed.
      return Promise.resolve(call === 1
        ? errorResponse({ code: 'TOKEN_EXPIRED' }, 403)
        : jsonResponse({ url }));
    });

    const first = api.get('/api/one');
    const second = api.get('/api/two');

    releaseRefresh();
    await expect(first).resolves.toEqual({ data: { url: '/api/one' } });
    await expect(second).resolves.toEqual({ data: { url: '/api/two' } });

    const refreshCalls = fetch.mock.calls.filter(([url]) => url === REFRESH_URL);
    expect(refreshCalls).toHaveLength(1);
  });
});
