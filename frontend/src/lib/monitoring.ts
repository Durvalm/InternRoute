"use client";

type MonitoringContext = {
  path?: string;
  method?: string;
  status?: number;
  feature?: string;
  expected?: boolean;
  retryAfterSeconds?: number | null;
};

type SentryScope = {
  setTag: (key: string, value: string) => void;
  setLevel: (level: "warning" | "error") => void;
  setContext: (name: string, context: Record<string, unknown>) => void;
};

type SentryClient = {
  init: (config: Record<string, unknown>) => void;
  withScope: (callback: (scope: SentryScope) => void) => void;
  captureException: (error: unknown) => void;
};

declare global {
  interface Window {
    Sentry?: SentryClient;
    __internrouteSentryInitialized?: boolean;
  }
}

const SENTRY_DSN = (process.env.NEXT_PUBLIC_SENTRY_DSN || "").trim();
const SENTRY_ENVIRONMENT = (process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development").trim();
const SENTRY_RELEASE = (process.env.NEXT_PUBLIC_SENTRY_RELEASE || "").trim() || undefined;
const SENTRY_TRACES_SAMPLE_RATE = Number.parseFloat(
  (process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || "0").trim()
);

function _isSentryEnabled(): boolean {
  return SENTRY_DSN.length > 0;
}

function _sentryClient(): SentryClient | null {
  if (typeof window === "undefined") return null;
  return window.Sentry || null;
}

function _sanitizeEvent(event: Record<string, unknown>): Record<string, unknown> | null {
  const tags = (event.tags || {}) as Record<string, unknown>;
  if (String(tags.expected || "") === "true") {
    return null;
  }
  const request = event.request as Record<string, unknown> | undefined;
  if (request && typeof request === "object") {
    delete request.data;
    delete request.cookies;
    const headers = request.headers as Record<string, unknown> | undefined;
    if (headers && typeof headers === "object") {
      for (const key of Object.keys(headers)) {
        const lowered = key.toLowerCase();
        if (lowered === "authorization" || lowered === "cookie" || lowered === "set-cookie" || lowered === "x-csrf-token") {
          headers[key] = "[Filtered]";
        }
      }
    }
  }
  return event;
}

export function initFrontendMonitoring(): boolean {
  if (!_isSentryEnabled() || typeof window === "undefined") {
    return false;
  }
  if (window.__internrouteSentryInitialized) {
    return true;
  }
  const client = _sentryClient();
  if (!client) {
    return false;
  }

  const tracesSampleRate = Number.isFinite(SENTRY_TRACES_SAMPLE_RATE)
    ? Math.max(0, Math.min(1, SENTRY_TRACES_SAMPLE_RATE))
    : 0;

  client.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    tracesSampleRate,
    sendDefaultPii: false,
    beforeSend: _sanitizeEvent,
  });
  window.__internrouteSentryInitialized = true;
  return true;
}

export function captureFrontendError(error: unknown, context: MonitoringContext = {}): void {
  if (context.expected) return;
  if (context.path === "/auth/me" && context.status === 401) return;
  if (typeof context.status === "number" && context.status < 500) return;
  if (!_isSentryEnabled() || typeof window === "undefined") return;

  if (!window.__internrouteSentryInitialized) {
    initFrontendMonitoring();
  }
  const client = _sentryClient();
  if (!client) return;

  const wrappedError = error instanceof Error ? error : new Error(String(error));

  client.withScope((scope) => {
    scope.setTag("feature", context.feature || "frontend");
    if (context.path) scope.setTag("path", context.path);
    if (context.method) scope.setTag("method", context.method);
    if (typeof context.status === "number") scope.setTag("http_status", String(context.status));
    scope.setLevel(typeof context.status === "number" && context.status >= 500 ? "error" : "warning");
    scope.setContext("api", {
      path: context.path || null,
      method: context.method || null,
      status: typeof context.status === "number" ? context.status : null,
      retry_after_seconds: context.retryAfterSeconds ?? null,
    });
    client.captureException(wrappedError);
  });
}
