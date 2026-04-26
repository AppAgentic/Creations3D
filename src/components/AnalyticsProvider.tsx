"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page_view", {
      search: window.location.search || null,
    });
  }, [pathname]);

  return null;
}
