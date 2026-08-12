/**
 * Client for NestJS enterprise API (/api/v1/*).
 * When NEST_API_URL is set, Next.js rewrites these paths to the NestJS server.
 */

const BASE = "/api/v1";

async function nestFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Nest API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const nestApi = {
  health: () => nestFetch<{ status: string; database: string; liveLlm: boolean }>("/health"),

  doctors: {
    list: (specialization?: string) =>
      nestFetch<unknown[]>(
        specialization ? `/doctors?specialization=${encodeURIComponent(specialization)}` : "/doctors"
      ),
    get: (id: string) => nestFetch<unknown>(`/doctors/${id}`),
  },

  appointments: {
    list: (params?: { userId?: string; doctorId?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.userId) q.set("userId", params.userId);
      if (params?.doctorId) q.set("doctorId", params.doctorId);
      if (params?.status) q.set("status", params.status);
      const qs = q.toString();
      return nestFetch<unknown[]>(`/appointments${qs ? `?${qs}` : ""}`);
    },
    create: (body: Record<string, unknown>) =>
      nestFetch<unknown>("/appointments", { method: "POST", body: JSON.stringify(body) }),
  },

  ai: {
    status: () => nestFetch<{ liveLlm: boolean; groqModel: string }>("/ai/status"),
    chat: (message: string, mode?: string, history?: Array<{ role: string; content: string }>) =>
      nestFetch<{ reply: string; liveLlm: boolean }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message, mode, history }),
      }),
  },

  innovation: {
    liveData: () => nestFetch<unknown>("/innovation/live-data"),
  },

  analytics: {
    enterpriseStats: () =>
      nestFetch<{
        datasetScale: string;
        totalRecords: number;
        breakdown: Record<string, number>;
      }>("/analytics/enterprise-stats"),
  },
};
