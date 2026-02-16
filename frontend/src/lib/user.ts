"use client";

export type StoredUser = {
  id?: number;
  email?: string | null;
  name: string | null;
  coding_skill_level: string | null;
  graduation_date: string | null;
  onboarding_completed: boolean;
};

const USER_KEY = "internshiproute_user";
export const USER_UPDATED_EVENT = "internshiproute:user-updated";

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
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
}
