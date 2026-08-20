import type { Title, Studio, EpisodeDetail } from "./types";

const BASE = "/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Ошибка запроса: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------- Публичное API ----------
export const api = {
  listTitles: () => request<Title[]>("/titles"),
  getTitle: (id: number) => request<Title>(`/titles/${id}`),
  search: (q: string) => request<Title[]>(`/search?q=${encodeURIComponent(q)}`),
  listStudios: () => request<Studio[]>("/studios"),
  getEpisode: (id: number) => request<EpisodeDetail>(`/episodes/${id}`),

  login: (email: string, password: string) =>
    request<{ token: string; admin: { id: number; email: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// ---------- Admin CRUD (обобщённый клиент под таблицы админки) ----------
export function adminResource<T extends { id: number } = any>(resource: string) {
  return {
    list: () => request<T[]>(`/admin/${resource}`),
    create: (data: Partial<T>) =>
      request<T>(`/admin/${resource}`, { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<T>) =>
      request<T>(`/admin/${resource}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/admin/${resource}/${id}`, { method: "DELETE" }),
  };
}
