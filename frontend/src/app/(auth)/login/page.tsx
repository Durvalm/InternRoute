"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { setToken } from "@/lib/auth";

type AuthResponse = {
  access_token: string;
  user: {
    onboarding_completed: boolean;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(data.access_token);
      router.push(data.user.onboarding_completed ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/90 p-8 shadow-soft border border-white/60">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-500">Sign in to continue.</p>

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
    </div>
  );
}
