"use client";

import { ReactNode } from "react";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AnalyticsProvider />
      {children}
    </AuthProvider>
  );
}
