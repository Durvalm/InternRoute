"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";

type ConfirmResponse = {
  ok: boolean;
  already_verified: boolean;
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    let active = true;

    const runConfirmation = async () => {
      if (!token) {
        if (!active) return;
        setError("Missing verification token.");
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest<ConfirmResponse>("/auth/email-verification/confirm", {
          method: "POST",
          body: JSON.stringify({ token }),
          skipAuthRedirect: true,
        });
        if (!active) return;
        setAlreadyVerified(response.already_verified);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : "Could not verify email. Please request a new link.";
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    runConfirmation();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 p-8 shadow-soft">
      <h1 className="text-2xl font-semibold">Email verification</h1>
      {loading ? <p className="mt-3 text-sm text-slate-500">Verifying your email...</p> : null}
      {!loading && !error ? (
        <p className="mt-3 text-sm text-slate-600">
          {alreadyVerified ? "Your email is already verified." : "Your email is verified. You can sign in now."}
        </p>
      ) : null}
      {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
      <div className="mt-6">
        <button
          className="rounded-xl bg-night px-4 py-2 text-sm font-semibold text-white"
          onClick={() => router.push(error ? "/register" : "/login?reason=email_verified")}
          type="button"
        >
          {error ? "Back to sign up" : "Go to sign in"}
        </button>
      </div>
    </div>
  );
}
