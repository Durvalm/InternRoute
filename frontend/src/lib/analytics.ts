"use client";

import { getUser } from "@/lib/user";

type TrackValue = string | number | boolean | null;
type TrackProperties = Record<string, TrackValue>;

type TrackOptions = {
  userId?: string | number;
  insertId?: string;
};

const POSTHOG_KEY = (process.env.NEXT_PUBLIC_POSTHOG_KEY || "").trim();
const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").trim().replace(/\/+$/, "");

function _env(name: string): string {
  const raw = process.env[name];
  return typeof raw === "string" ? raw : "";
}

const ANALYTICS_ENV = (_env("NEXT_PUBLIC_POSTHOG_ENVIRONMENT") || process.env.NODE_ENV || "development").trim();
const ANALYTICS_APP_VERSION = (_env("NEXT_PUBLIC_APP_VERSION") || _env("NEXT_PUBLIC_SENTRY_RELEASE") || "dev").trim();

function _isEnabled(): boolean {
  return POSTHOG_KEY.length > 0 && POSTHOG_HOST.length > 0;
}

function _currentUserId(): string | null {
  const user = getUser();
  const id = user?.id;
  if (typeof id === "number") return String(id);
  return null;
}

function _isoNow(): string {
  return new Date().toISOString();
}

function _commonProperties(userId: string): TrackProperties {
  return {
    user_id: userId,
    env: ANALYTICS_ENV,
    app_version: ANALYTICS_APP_VERSION,
    platform: "web",
  };
}

export function trackEvent(event: string, properties: TrackProperties = {}, options: TrackOptions = {}): void {
  if (!_isEnabled()) return;

  const resolvedUserId = options.userId != null ? String(options.userId) : _currentUserId();
  if (!resolvedUserId) return;
  const nowIso = _isoNow();

  const payloadProperties: Record<string, unknown> = {
    ..._commonProperties(resolvedUserId),
    timestamp: nowIso,
    ...properties,
  };
  if (options.insertId) {
    payloadProperties.$insert_id = options.insertId;
  }

  const payload = {
    api_key: POSTHOG_KEY,
    event,
    distinct_id: resolvedUserId,
    timestamp: nowIso,
    properties: payloadProperties,
  };

  fetch(`${POSTHOG_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Analytics should never break app flow.
  });
}

export function trackSessionStarted(entryPath: string): void {
  if (typeof window === "undefined") return;
  if (window.sessionStorage.getItem("internroute:analytics:session_started") === "1") {
    return;
  }
  trackEvent("session_started", { entry_path: entryPath || "/" });
  window.sessionStorage.setItem("internroute:analytics:session_started", "1");
}

export function trackActiveDay(): void {
  if (typeof window === "undefined") return;
  const userId = _currentUserId();
  if (!userId) return;
  const todayUtc = new Date().toISOString().slice(0, 10);
  const key = `internroute:analytics:active_day:${userId}`;
  if (window.localStorage.getItem(key) === todayUtc) {
    return;
  }
  trackEvent("active_day", { active_date: todayUtc }, { userId });
  window.localStorage.setItem(key, todayUtc);
}

export function trackModuleViewed(moduleKey: string, pathname: string): void {
  trackEvent("module_viewed", {
    module_key: moduleKey,
    path: pathname,
  });
}

export function trackLogoutClicked(fromPath: string): void {
  trackEvent("logout_clicked", { from_path: fromPath || "/" });
}
