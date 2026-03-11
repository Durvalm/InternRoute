"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import { clearUser, setUser } from "@/lib/user";

const PUBLIC_PATHS = ["/login", "/register"];

type MeResponse = {
  user: {
    name: string | null;
    graduation_date: string | null;
    is_superuser: boolean;
    onboarding_completed: boolean;
  };
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
    setChecked(false);
    const failClosed = () => {
      clearUser();
      if (isPublicPath) {
        setChecked(true);
        return;
      }
      router.replace("/login");
      setChecked(false);
    };
    const controller = new AbortController();
    const authCheckTimeout = window.setTimeout(() => {
      if (!active) return;
      controller.abort();
      failClosed();
    }, 8000);

    apiRequest<MeResponse>("/auth/me", { signal: controller.signal, skipAuthRedirect: true })
      .then((data) => {
        if (!active) return;
        window.clearTimeout(authCheckTimeout);
        setUser(data.user);
        if (isPublicPath) {
          router.replace(data.user.onboarding_completed ? "/dashboard" : "/onboarding");
          return;
        }
        if (!data.user.onboarding_completed && !pathname.startsWith("/onboarding")) {
          router.replace("/onboarding");
          return;
        }
        if (data.user.onboarding_completed && pathname.startsWith("/onboarding")) {
          router.replace("/dashboard");
          return;
        }
        setChecked(true);
      })
      .catch((error) => {
        if (!active) return;
        window.clearTimeout(authCheckTimeout);
        if (error instanceof ApiError && error.status === 401) {
          failClosed();
          return;
        }
        failClosed();
      });

    return () => {
      active = false;
      window.clearTimeout(authCheckTimeout);
      controller.abort();
    };
  }, [pathname, router]);

  if (!checked) {
    return null;
  }

  return <>{children}</>;
}
