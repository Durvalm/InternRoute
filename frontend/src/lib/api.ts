import { getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers,
    ...options
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      const { clearToken } = await import("@/lib/auth");
      clearToken();
      window.location.href = "/login";
    }
    throw new Error(`API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
