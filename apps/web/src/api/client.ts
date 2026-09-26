/* Thin fetch wrapper. Every state change carries X-UBite: 1 (the API's cross-site guard) and the
   session cookie; errors come back as ApiError with the API's plain code. */

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string, public body?: any) {
    super(message || code);
  }
  get offline() {
    return this.status === 0;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(res.status, body?.error || `http_${res.status}`, body?.message, body);
  return body as T;
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { credentials: 'same-origin', headers: { Accept: 'application/json' }, ...init });
  } catch {
    throw new ApiError(0, 'offline');
  }
  return handle<T>(res);
}

export async function apiSend<T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  let res: Response;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: { 'X-UBite': '1', Accept: 'application/json', ...(isForm || body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: isForm ? (body as FormData) : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'offline');
  }
  return handle<T>(res);
}
