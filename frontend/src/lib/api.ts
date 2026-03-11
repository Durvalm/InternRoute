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

type ApiRequestOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

export async function apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const { skipAuthRedirect = false, ...requestInit } = options || {};
  const method = (requestInit.method || "GET").toUpperCase();
  const isFormDataBody = typeof FormData !== "undefined" && requestInit.body instanceof FormData;
  const headers = new Headers(requestInit.headers || undefined);

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requiresCsrf = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  if (requiresCsrf && !headers.has("X-CSRF-TOKEN") && typeof document !== "undefined") {
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("internroute_csrf_token="))
      ?.split("=")[1];
    if (csrfToken) {
      headers.set("X-CSRF-TOKEN", decodeURIComponent(csrfToken));
    }
  }

  const res = await fetch(`${requireApiUrl()}${path}`, {
    ...requestInit,
    headers,
    credentials: requestInit.credentials || "include",
  });

  if (!res.ok) {
    if (res.status === 401 && !skipAuthRedirect && typeof window !== "undefined") {
      const { clearUser } = await import("@/lib/user");
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
