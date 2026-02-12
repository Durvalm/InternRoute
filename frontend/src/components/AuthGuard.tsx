"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

const AUTH_PATHS = ["/login", "/register", "/onboarding"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getToken();
    if (!token && !AUTH_PATHS.some((path) => pathname.startsWith(path))) {
      router.replace("/login");
    }
  }, [pathname, router]);

  return <>{children}</>;
}
