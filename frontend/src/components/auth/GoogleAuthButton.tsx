"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import { setUser as storeUser } from "@/lib/user";

type GoogleAuthButtonProps = {
  mode: "signin" | "signup";
  onError: (message: string | null) => void;
  disabled?: boolean;
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    context?: "signin" | "signup" | "use";
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with";
      shape?: "rectangular" | "pill";
      width?: number;
      logo_alignment?: "left" | "center";
    },
  ) => void;
};

type AuthResponse = {
  user: {
    id: number;
    email: string;
    name: string | null;
    graduation_date: string | null;
    is_superuser: boolean;
    onboarding_completed: boolean;
    password_login_enabled?: boolean;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

export default function GoogleAuthButton({ mode, onError, disabled = false }: GoogleAuthButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const submittingRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buttonMounted, setButtonMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.accounts?.id) {
      setScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID || !buttonRef.current) return;
    if (!window.google?.accounts?.id) return;

    const googleAccountsId = window.google.accounts.id;
    const target = buttonRef.current;

    if (!initializedRef.current) {
      googleAccountsId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        ux_mode: "popup",
        context: mode,
        callback: async (response) => {
          const credential = response.credential?.trim();
          if (!credential || submittingRef.current) {
            onError("Google sign-in failed.");
            return;
          }

          onError(null);
          submittingRef.current = true;
          setSubmitting(true);
          try {
            const data = await apiRequest<AuthResponse>("/auth/google", {
              method: "POST",
              body: JSON.stringify({ credential }),
              skipAuthRedirect: true,
            });
            storeUser(data.user);
            router.push(data.user.onboarding_completed ? "/dashboard" : "/onboarding");
          } catch (error) {
            const message = error instanceof ApiError ? error.message : "Google sign-in failed.";
            onError(message);
          } finally {
            submittingRef.current = false;
            setSubmitting(false);
          }
        },
      });
      initializedRef.current = true;
    }

    const renderGoogleButton = () => {
      target.innerHTML = "";
      googleAccountsId.renderButton(target, {
        theme: "outline",
        size: "large",
        text: mode === "signup" ? "signup_with" : "continue_with",
        shape: "rectangular",
        width: Math.max(Math.floor(target.clientWidth), 320),
        logo_alignment: "left",
      });
      setButtonMounted(true);
    };

    renderGoogleButton();

    const resizeObserver = new ResizeObserver(() => {
      renderGoogleButton();
    });
    resizeObserver.observe(target);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mode, onError, router, scriptReady]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  const isDisabled = disabled || submitting || !buttonMounted;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => onError("Could not load Google sign-in.")}
      />
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs font-medium text-slate-500">or continue with</span>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => {
              if (!buttonMounted) {
                onError("Google sign-in is still loading.");
              }
            }}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-[17px] font-medium text-slate-800 transition-colors ${
              isDisabled
                ? "cursor-not-allowed opacity-70"
                : "hover:bg-slate-50"
            }`}
          >
            <GoogleGlyph />
            <span>{mode === "signup" ? "Continue with Google" : "Continue with Google"}</span>
          </button>
          <div
            ref={buttonRef}
            className={`absolute inset-0 z-10 overflow-hidden rounded-xl opacity-0 ${disabled || submitting || !buttonMounted ? "pointer-events-none" : ""}`}
          />
        </div>
      </div>
    </>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] shrink-0">
      <path fill="#EA4335" d="M9 3.48c1.69 0 2.84.73 3.49 1.34l2.54-2.54C13.49.84 11.44 0 9 0 5.48 0 2.44 2.02.96 4.96l2.95 2.29C4.62 5.14 6.62 3.48 9 3.48z" />
      <path fill="#4285F4" d="M18 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h5.06c-.22 1.13-.87 2.09-1.84 2.73l2.82 2.18C16.68 14.24 18 11.98 18 9.2z" />
      <path fill="#FBBC05" d="M3.91 10.74c-.18-.54-.28-1.12-.28-1.74s.1-1.2.28-1.74L.96 4.96C.35 6.18 0 7.55 0 9s.35 2.82.96 4.04l2.95-2.3z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.82-2.18c-.78.52-1.78.82-3.14.82-2.38 0-4.38-1.66-5.09-3.88L.96 13.04C2.44 15.98 5.48 18 9 18z" />
    </svg>
  );
}
