"use client";

export type StoredUser = {
  id?: number;
  email?: string | null;
  name: string | null;
  graduation_date: string | null;
  is_superuser?: boolean;
  onboarding_completed: boolean;
  password_login_enabled?: boolean;
  email_verified?: boolean;
};

const USER_KEY = "internroute_user";
const CSRF_TOKEN_KEY = "internroute_csrf_token_value";
export const USER_UPDATED_EVENT = "internroute:user-updated";

export function setUser(user: StoredUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
}

export function getUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch (err) {
    return null;
  }
}

export function clearUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(CSRF_TOKEN_KEY);
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
}
