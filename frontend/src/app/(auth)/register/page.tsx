"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { setUser as storeUser } from "@/lib/user";

type AuthResponse = {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string | null;
    coding_skill_level: string | null;
    graduation_date: string | null;
    onboarding_completed: boolean;
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validatePassword = (value: string) => {
    if (new TextEncoder().encode(value).length > 72) {
      return "Password must be 72 bytes or less.";
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validatePassword(password);
    if (validation) {
      setPasswordError(validation);
      return;
    }

    setError(null);
    setPasswordError(null);
    setLoading(true);

    try {
      const data = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(data.access_token);
      storeUser(data.user);
      router.push(data.user.onboarding_completed ? "/dashboard" : "/onboarding");
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "Could not create account. Try another email.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/90 p-8 shadow-soft border border-white/60">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-slate-500">Start building your internship plan.</p>

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
            placeholder="Create a secure password"
            value={password}
            onChange={(event) => {
              const next = event.target.value;
              setPassword(next);
              setPasswordError(validatePassword(next));
            }}
          />
        </div>
        {passwordError ? <p className="text-xs text-amber-600">{passwordError}</p> : null}
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        <button
          className="w-full rounded-xl bg-night text-white py-3 text-sm font-semibold disabled:opacity-60"
          disabled={loading || Boolean(passwordError)}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-xs text-slate-500">
        Already have an account?{" "}
        <a className="text-indigo-600 hover:underline" href="/login">
          Sign in
        </a>
      </p>
    </div>
  );
}
