"use client";

import { useEffect } from "react";
import { initFrontendMonitoring } from "@/lib/monitoring";

export default function MonitoringBootstrap() {
  useEffect(() => {
    if (initFrontendMonitoring()) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const initialized = initFrontendMonitoring();
      if (initialized || attempts >= 20) {
        window.clearInterval(timer);
      }
    }, 500);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
