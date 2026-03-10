import { getToken } from "@/lib/auth";

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const API_URL =
  rawApiUrl.length > 0
    ? rawApiUrl.replace(/\/+$/, "")
    : process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:5000";

function requireApiUrl(): string {
  if (API_URL) {
    return API_URL;
  }
  throw new Error("NEXT_PUBLIC_API_URL is required in production.");
}

export class ApiError extends Error {
  status: number;
  retryAfterSeconds: number | null;

  constructor(message: string, status: number, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const isFormDataBody = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const headers = new Headers(options?.headers || undefined);

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${requireApiUrl()}${path}`, {
    ...options,
    headers,
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

    throw new ApiError(message, res.status, retryAfterSeconds);
  }

  return res.json() as Promise<T>;
}
