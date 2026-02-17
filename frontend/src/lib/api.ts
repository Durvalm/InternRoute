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
      const { clearUser } = await import("@/lib/user");
      clearToken();
      clearUser();
      window.location.href = "/login";
    }

    let message = `API error: ${res.status}`;
    let retryAfterSeconds: number | null = null;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
      if (data?.msg) message = data.msg;
      if (typeof data?.retry_after_seconds === "number" && Number.isFinite(data.retry_after_seconds)) {
        retryAfterSeconds = Math.max(1, Math.floor(data.retry_after_seconds));
      }
    } catch (err) {
      // ignore JSON parse errors
    }

    if (retryAfterSeconds === null) {
      const retryAfterHeader = res.headers.get("Retry-After");
      if (retryAfterHeader) {
        const parsed = Number.parseInt(retryAfterHeader, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          retryAfterSeconds = parsed;
        }
      }
    }

    if (res.status === 429 && retryAfterSeconds !== null) {
      message = `${message} Please wait ${retryAfterSeconds}s before trying again.`;
    }

    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
