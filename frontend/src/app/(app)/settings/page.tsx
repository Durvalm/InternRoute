"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { getUser, setUser, type StoredUser } from "@/lib/user";

type MeResponse = {
  user: {
    id: number;
    email: string;
    name: string | null;
    graduation_date: string | null;
    is_superuser: boolean;
    onboarding_completed: boolean;
  };
};

type ProfileState = {
  name: string;
  graduationMonth: string;
};

function toMonthInput(dateValue: string | null | undefined): string {
  if (!dateValue) return "";
  return dateValue.slice(0, 7);
}

function toStoredUser(payload: MeResponse["user"]): StoredUser {
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    graduation_date: payload.graduation_date,
    is_superuser: payload.is_superuser,
    onboarding_completed: payload.onboarding_completed
  };
}

export default function SettingsPage() {
  const [email, setEmail] = useState<string>("");
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [profile, setProfile] = useState<ProfileState>({
    name: "",
    graduationMonth: ""
  });
  const [initialProfile, setInitialProfile] = useState<ProfileState | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    const cached = getUser();
    if (cached) {
      setEmail(cached.email ?? "");
      setOnboardingCompleted(Boolean(cached.onboarding_completed));
      setProfile((prev) => ({
        ...prev,
        name: cached.name ?? "",
        graduationMonth: toMonthInput(cached.graduation_date)
      }));
      setInitialProfile({
        name: cached.name ?? "",
        graduationMonth: toMonthInput(cached.graduation_date)
      });
    }

    apiRequest<MeResponse>("/auth/me")
      .then((data) => {
        const nextProfile: ProfileState = {
          name: data.user.name ?? "",
          graduationMonth: toMonthInput(data.user.graduation_date)
        };

        setEmail(data.user.email ?? "");
        setOnboardingCompleted(data.user.onboarding_completed);
        setProfile(nextProfile);
        setInitialProfile(nextProfile);
        setUser(toStoredUser(data.user));
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load settings.";
        setLoadingError(message);
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }, []);

  const isProfileDirty = useMemo(() => {
    if (!initialProfile) return false;
    return (
      profile.name.trim() !== initialProfile.name.trim()
      || profile.graduationMonth !== initialProfile.graduationMonth
    );
  }, [initialProfile, profile.graduationMonth, profile.name]);

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profile.name.trim()) {
      setProfileError("Name is required.");
      return;
    }
    if (!profile.graduationMonth) {
      setProfileError("Graduation month is required.");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await apiRequest<MeResponse>("/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name.trim(),
          graduation_date: profile.graduationMonth
        })
      });

      const nextProfile: ProfileState = {
        name: response.user.name ?? "",
        graduationMonth: toMonthInput(response.user.graduation_date)
      };

      setProfile(nextProfile);
      setInitialProfile(nextProfile);
      setOnboardingCompleted(response.user.onboarding_completed);
      setUser(toStoredUser(response.user));
      setProfileSuccess("Profile updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile.";
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Fill all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    setSavingPassword(true);
    try {
      await apiRequest<{ message: string }>("/user/password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update password.";
      setPasswordError(message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your profile, graduation timeline, and account security.
            </p>
          </div>
        </div>
      </section>

      {loadingError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadingError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              These values personalize your timeline and dashboard progression.
            </p>
          </div>

          <form className="space-y-5 px-6 py-5" onSubmit={handleProfileSave}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Full Name
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={profile.name}
                  onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-10 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-400"
                  placeholder="Alex Johnson"
                  disabled={loadingProfile}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Graduation Month
                </label>
                <div className="relative mt-2">
                  <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="month"
                    value={profile.graduationMonth}
                    onChange={(event) => setProfile((prev) => ({
                      ...prev,
                      graduationMonth: event.target.value
                    }))}
                    className="w-full rounded-xl border border-slate-200 px-10 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-400"
                    disabled={loadingProfile}
                    required
                  />
                </div>
              </div>
            </div>

            {profileError ? (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle size={16} />
                {profileError}
              </div>
            ) : null}
            {profileSuccess ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 size={16} />
                {profileSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loadingProfile || savingProfile || !isProfileDirty}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Account</h2>
          <p className="mt-1 text-sm text-slate-500">Main account information.</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-800">
                <Mail size={14} className="text-slate-400" />
                {email || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Onboarding</p>
              <p className={`mt-1 text-sm font-medium ${onboardingCompleted ? "text-emerald-700" : "text-amber-700"}`}>
                {onboardingCompleted ? "Completed" : "Incomplete"}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Security</h2>
          <p className="mt-1 text-sm text-slate-500">
            Change your account password.
          </p>
        </div>

        <form className="space-y-4 px-6 py-5" onSubmit={handlePasswordSave}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Password
              </label>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-10 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-400"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                New Password
              </label>
              <div className="relative mt-2">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-10 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-400"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Confirm New Password
              </label>
              <div className="relative mt-2">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-10 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-400"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          {passwordError ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle size={16} />
              {passwordError}
            </div>
          ) : null}
          {passwordSuccess ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 size={16} />
              {passwordSuccess}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck size={16} />
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>
    </div>
  );
}
