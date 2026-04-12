"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const Hero3D = dynamic(
  () => import("@/components/Hero3D").then((mod) => mod.Hero3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.7_0.18_265)] opacity-50" />
      </div>
    ),
  }
);

export function Hero3DWrapper() {
  return <Hero3D />;
}
