"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { clearUser, setUser } from "@/lib/user";

const PUBLIC_PATHS = ["/login", "/register"];

type MeResponse = {
  user: {
    name: string | null;
    coding_skill_level: string | null;
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
    const token = getToken();
    if (!token) {
      clearUser();
      if (!PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        router.replace("/login");
      }
      setChecked(true);
      return;
    }

    apiRequest<MeResponse>("/auth/me")
      .then((data) => {
        setUser(data.user);
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
        // Keep sessions on transient API/server errors; only clear auth on 401.
        if (error instanceof ApiError && error.status === 401) {
          clearToken();
          clearUser();
          router.replace("/login");
          setChecked(true);
          return;
        }
        setChecked(true);
      });
  }, [pathname, router]);

  if (!checked) {
    return null;
  }

  return <>{children}</>;
}
