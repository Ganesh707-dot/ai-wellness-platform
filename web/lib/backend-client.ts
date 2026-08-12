/**
 * Server-side client for NestJS API (used by Next.js route handlers).
 * Set NEST_API_URL in env. Unwraps Nest transform envelope { success, data }.
 */

export function getNestApiUrl() {
  const explicit = process.env.NEST_API_URL?.replace(/\/$/, '');
  if (explicit) return explicit;
  // Same Vercel deployment — Nest served at /api/v1 via web/api/nest.ts
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return '';
}

export function useDatabaseMode() {
  return process.env.DEMO_MODE === 'false' && Boolean(process.env.DATABASE_URL);
}

type NestEnvelope<T> = { success?: boolean; data?: T };

export async function nestServer<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getNestApiUrl();
  if (!base) {
    throw new Error('NEST_API_URL is not configured');
  }

  const res = await fetch(`${base}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const body = (await res.json()) as NestEnvelope<T> | T;
  if (!res.ok) {
    const err = body as { error?: unknown; message?: string };
    throw new Error(typeof err.error === 'string' ? err.error : `API ${res.status}`);
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return (body as NestEnvelope<T>).data as T;
  }
  return body as T;
}

export const backend = {
  users: {
    list: (page = 1, limit = 50) =>
      nestServer<{ data: unknown[]; meta: { total: number } }>(`/users?page=${page}&limit=${limit}`),
    create: (body: Record<string, unknown>) =>
      nestServer<unknown>('/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      nestServer<unknown>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => nestServer<{ deleted: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  },
  doctors: {
    list: (specialization?: string, page = 1, limit = 20) => {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (specialization) q.set('specialization', specialization);
      return nestServer<{ data: unknown[]; meta: { total: number } }>(`/doctors?${q}`);
    },
  },
  appointments: {
    list: (params: { userId?: string; doctorId?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params.userId) q.set('userId', params.userId);
      if (params.doctorId) q.set('doctorId', params.doctorId);
      q.set('page', String(params.page ?? 1));
      q.set('limit', String(params.limit ?? 20));
      return nestServer<{ data: unknown[]; meta: { total: number } }>(`/appointments?${q}`);
    },
    get: (id: string) => nestServer<unknown>(`/appointments/${id}`),
    create: (body: Record<string, unknown>) =>
      nestServer<unknown>('/appointments', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      nestServer<unknown>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) =>
      nestServer<{ deleted: boolean }>(`/appointments/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    stats: () => nestServer<{ totalRecords: number; breakdown: Record<string, number> }>('/analytics/enterprise-stats'),
  },
};
