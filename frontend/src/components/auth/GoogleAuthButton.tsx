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
      type?: "standard" | "icon";
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
    email_verified?: boolean;
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
  const containerRef = useRef<HTMLDivElement | null>(null);
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
    if (!scriptReady || !GOOGLE_CLIENT_ID || !containerRef.current) return;
    if (!window.google?.accounts?.id) return;

    const googleAccountsId = window.google.accounts.id;
    const target = containerRef.current;

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
      const width = Math.max(Math.min(Math.floor(target.clientWidth), 400), 280);
      googleAccountsId.renderButton(target, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: mode === "signup" ? "signup_with" : "continue_with",
        shape: "rectangular",
        width,
        logo_alignment: "left",
      });
      setButtonMounted(true);
    };

    renderGoogleButton();
    requestAnimationFrame(renderGoogleButton);
    // Let Google own the button node after first render; avoid churn that can break clicks in prod.
    return undefined;
  }, [mode, onError, router, scriptReady]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  const isDisabled = disabled || submitting;

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
        <div className={`flex justify-center ${isDisabled ? "pointer-events-none opacity-70" : ""}`} aria-disabled={isDisabled}>
          <div ref={containerRef} className="w-full max-w-[400px]" />
        </div>
        {!buttonMounted ? (
          <div className="mx-auto h-11 w-full max-w-[400px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
        ) : null}
      </div>
    </>
  );
}
