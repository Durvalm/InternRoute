"use client";

import { useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

type RegisterResponse = {
  requires_email_verification: boolean;
  email: string;
  email_delivery: "sent" | "failed";
  message?: string;
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

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
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    setError(null);
    setNotice(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setLoading(true);

    try {
      const data = await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuthRedirect: true,
      });
      setEmail(data.email || email.trim().toLowerCase());
      setAwaitingVerification(Boolean(data.requires_email_verification));
      setNotice(
        data.email_delivery === "failed"
          ? data.message || "Account created, but verification email failed to send. Request a new link."
          : `Verification email sent to ${data.email}.`,
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not create account. Try another email.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setError(null);
    setNotice(null);
    setResending(true);

    try {
      await apiRequest<{ ok: boolean }>("/auth/email-verification/resend", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuthRedirect: true,
      });
      setNotice(`Verification email sent to ${email}.`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not resend verification email. Try again.";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  if (awaitingVerification) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/90 p-8 shadow-soft">
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-500">
          Finish signup by opening the verification link sent to <span className="font-medium text-slate-700">{email}</span>.
        </p>
        {notice ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</p> : null}
        {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
        <div className="mt-6 flex gap-3">
          <button
            className="rounded-xl bg-night px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={resending}
            onClick={handleResend}
            type="button"
          >
            {resending ? "Sending..." : "Resend email"}
          </button>
          <a className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/login">
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

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
              if (confirmPassword) {
                setConfirmPasswordError(next === confirmPassword ? null : "Passwords do not match.");
              }
            }}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Confirm password</label>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => {
              const next = event.target.value;
              setConfirmPassword(next);
              setConfirmPasswordError(next === password ? null : "Passwords do not match.");
            }}
          />
        </div>
        {passwordError ? <p className="text-xs text-amber-600">{passwordError}</p> : null}
        {confirmPasswordError ? <p className="text-xs text-amber-600">{confirmPasswordError}</p> : null}
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        {notice ? <p className="text-xs text-emerald-600">{notice}</p> : null}
        <button
          className="w-full rounded-xl bg-night text-white py-3 text-sm font-semibold disabled:opacity-60"
          disabled={loading || Boolean(passwordError) || Boolean(confirmPasswordError)}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <div className="mt-4">
        <GoogleAuthButton mode="signup" onError={setError} disabled={loading} />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Already have an account?{" "}
        <a className="text-indigo-600 hover:underline" href="/login">
          Sign in
        </a>
      </p>
    </div>
  );
}
