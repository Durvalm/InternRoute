"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackActiveDay, trackModuleViewed, trackSessionStarted } from "@/lib/analytics";

const PATH_TO_MODULE_KEY: Array<{ prefix: string; moduleKey: string }> = [
  { prefix: "/timeline", moduleKey: "timeline" },
  { prefix: "/skills", moduleKey: "coding" },
  { prefix: "/projects", moduleKey: "projects" },
  { prefix: "/resume", moduleKey: "resume" },
  { prefix: "/applications", moduleKey: "applications" },
  { prefix: "/interview-prep", moduleKey: "interview_prep" },
  { prefix: "/leetcode", moduleKey: "leetcode" },
  { prefix: "/opportunities", moduleKey: "opportunities" },
];

function moduleKeyFromPath(pathname: string): string | null {
  const normalized = pathname || "/";
  const match = PATH_TO_MODULE_KEY.find((item) => normalized.startsWith(item.prefix));
  return match?.moduleKey ?? null;
}

export default function AppAnalytics() {
  const pathname = usePathname();
  const trackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    const normalizedPath = pathname || "/";

    trackSessionStarted(normalizedPath);
    trackActiveDay();

    if (trackedPathRef.current === normalizedPath) return;
    trackedPathRef.current = normalizedPath;

    const moduleKey = moduleKeyFromPath(normalizedPath);
    if (moduleKey) {
      trackModuleViewed(moduleKey, normalizedPath);
    }
  }, [pathname]);

  return null;
}
