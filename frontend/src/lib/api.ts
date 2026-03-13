import { captureFrontendError } from "@/lib/monitoring";

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const API_URL =
  rawApiUrl.length > 0
    ? rawApiUrl.replace(/\/+$/, "")
    : process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:5000";
const CSRF_COOKIE_NAME = "internroute_csrf_token";
const CSRF_STORAGE_KEY = "internroute_csrf_token_value";

type CsrfTokenPayload = {
  csrf_token?: unknown;
};

function requireApiUrl(): string {
  if (API_URL) {
    return API_URL;
  }
  throw new Error("NEXT_PUBLIC_API_URL is required in production.");
}

function readCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const csrfCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.split("=")[1];
  if (!csrfCookie) return null;
  return decodeURIComponent(csrfCookie);
}

function readCsrfTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(CSRF_STORAGE_KEY);
  if (!token) return null;
  const normalized = token.trim();
  return normalized.length > 0 ? normalized : null;
}

function storeCsrfToken(token: unknown): void {
  if (typeof window === "undefined") return;
  if (typeof token !== "string") return;
  const normalized = token.trim();
  if (!normalized) return;
  window.localStorage.setItem(CSRF_STORAGE_KEY, normalized);
}

function clearStoredCsrfToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CSRF_STORAGE_KEY);
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
  skipErrorMonitoring?: boolean;
  expectedStatuses?: number[];
};

export async function apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const {
    skipAuthRedirect = false,
    skipErrorMonitoring = false,
    expectedStatuses = [],
    ...requestInit
  } = options || {};
  const method = (requestInit.method || "GET").toUpperCase();
  const isFormDataBody = typeof FormData !== "undefined" && requestInit.body instanceof FormData;
  const headers = new Headers(requestInit.headers || undefined);

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requiresCsrf = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  if (requiresCsrf && !headers.has("X-CSRF-TOKEN")) {
    const csrfToken = readCsrfTokenFromCookie() || readCsrfTokenFromStorage();
    if (csrfToken) {
      headers.set("X-CSRF-TOKEN", csrfToken);
    }
  }

  let res: Response;
  try {
    res = await fetch(`${requireApiUrl()}${path}`, {
      ...requestInit,
      headers,
      credentials: requestInit.credentials || "include",
    });
  } catch (error) {
    if (!skipErrorMonitoring) {
      captureFrontendError(error, { path, method, feature: "api_request" });
    }
    throw error;
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearStoredCsrfToken();
    }

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

    const isExpectedStatus = expectedStatuses.includes(res.status);
    if (!skipErrorMonitoring && !isExpectedStatus) {
      captureFrontendError(new ApiError(message, res.status, retryAfterSeconds), {
        path,
        method,
        status: res.status,
        retryAfterSeconds,
        feature: "api_request",
        expected: path === "/auth/me" && res.status === 401,
      });
    }

    throw new ApiError(message, res.status, retryAfterSeconds);
  }

  const payload = (await res.json()) as T;
  const csrfToken = (payload as CsrfTokenPayload).csrf_token;
  if (csrfToken !== undefined) {
    storeCsrfToken(csrfToken);
  }
  return payload;
}
