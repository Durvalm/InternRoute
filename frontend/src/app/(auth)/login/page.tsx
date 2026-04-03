"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { setUser as storeUser } from "@/lib/user";

type AuthResponse = {
  user: {
    id: number;
    email: string;
    name: string | null;
    graduation_date: string | null;
    is_superuser: boolean;
    onboarding_completed: boolean;
    password_login_enabled?: boolean;
    email_verified?: boolean;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordChanged = searchParams.get("reason") === "password_changed";
  const emailVerified = searchParams.get("reason") === "email_verified";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuthRedirect: true,
      });
      storeUser(data.user);
      router.push(data.user.onboarding_completed ? "/dashboard" : "/onboarding");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Invalid email or password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/90 p-8 shadow-soft border border-white/60">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-500">Sign in to continue.</p>
      {passwordChanged ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Password updated. Please sign in again.
        </p>
      ) : null}
      {emailVerified ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Email verified. You can now sign in.
        </p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-medium text-slate-600">Email</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="you@school.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Password</label>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        <button
          className="w-full rounded-xl bg-night text-white py-3 text-sm font-semibold disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="mt-4">
        <GoogleAuthButton mode="signin" onError={setError} disabled={loading} />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        New here?{" "}
        <a className="text-indigo-600 hover:underline" href="/register">
          Create an account
        </a>
      </p>
    </div>
  );
}
