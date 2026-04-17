"use client";

import { memo } from "react";

const ITEMS = [
  "unity-ready",
  "unreal engine",
  "blender import",
  "glb · fbx · obj",
  "pbr textures",
  "three.js",
  "game dev",
  "30-second render",
  "text to 3d",
  "image to 3d",
  "world generation",
  "no watermarks",
];

export const KineticMarquee = memo(function KineticMarquee() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="hairline-t hairline-b py-5 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="marquee-track flex gap-10 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-display font-bold text-3xl md:text-5xl tracking-tight flex items-center gap-10 text-foreground/50"
          >
            {item}
            <span
              aria-hidden
              className="inline-block size-2 rounded-full bg-accent shrink-0"
            />
          </span>
        ))}
      </div>
    </div>
  );
});
