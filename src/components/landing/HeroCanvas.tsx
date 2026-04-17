"use client";

import { memo } from "react";
import { motion } from "framer-motion";

/**
 * Perpetual micro-interaction — isolated client leaf, memoized.
 * Renders a rotating wireframe mesh + orbiting credit chip above a
 * translucent "liquid glass" platform. CSS-driven; no WebGL payload.
 */
export const HeroCanvas = memo(function HeroCanvas() {
  return (
    <div className="relative aspect-[4/5] w-full rounded-3xl glass-panel overflow-hidden">
      {/* Corner registration marks */}
      <div className="absolute inset-4 pointer-events-none">
        {[
          "top-0 left-0",
          "top-0 right-0",
          "bottom-0 left-0",
          "bottom-0 right-0",
        ].map((pos) => (
          <div
            key={pos}
            className={`absolute ${pos} size-3 border-accent/60`}
            style={{
              borderTopWidth: pos.includes("top") ? 1 : 0,
              borderBottomWidth: pos.includes("bottom") ? 1 : 0,
              borderLeftWidth: pos.includes("left") ? 1 : 0,
              borderRightWidth: pos.includes("right") ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* Frame label */}
      <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        preview · glb
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.2em] text-accent flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-accent" />
        live
      </div>

      {/* Mesh visual */}
      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: "preserve-3d" }}
          className="size-64 md:size-72"
        >
          <svg viewBox="-100 -100 200 200" className="w-full h-full">
            <defs>
              <radialGradient id="meshGlow" cx="50%" cy="50%" r="50%">
                <stop
                  offset="0%"
                  stopColor="oklch(0.92 0.18 120)"
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor="oklch(0.92 0.18 120)"
                  stopOpacity="0"
                />
              </radialGradient>
            </defs>
            <circle cx="0" cy="0" r="80" fill="url(#meshGlow)" />
            {/* Latitude rings */}
            <g
              stroke="oklch(1 0 0 / 0.5)"
              strokeWidth="0.5"
              fill="none"
            >
              {[-60, -40, -20, 0, 20, 40, 60].map((y) => (
                <ellipse
                  key={y}
                  cx="0"
                  cy={y}
                  rx={Math.sqrt(Math.max(0, 70 * 70 - y * y))}
                  ry={Math.sqrt(Math.max(0, 70 * 70 - y * y)) * 0.25}
                />
              ))}
            </g>
            {/* Longitude arcs */}
            <g
              stroke="oklch(0.92 0.18 120 / 0.9)"
              strokeWidth="0.6"
              fill="none"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="0"
                  rx={70 * Math.cos((i * Math.PI) / 12)}
                  ry="70"
                  transform={`rotate(${(i * 180) / 12})`}
                />
              ))}
            </g>
            {/* Vertices */}
            <g fill="oklch(0.92 0.18 120)">
              {[
                [0, -70],
                [70, 0],
                [0, 70],
                [-70, 0],
                [50, -50],
                [-50, 50],
                [50, 50],
                [-50, -50],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="1.6" />
              ))}
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Floating credit chip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="absolute bottom-5 left-5 right-5 flex items-end justify-between"
      >
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            input
          </div>
          <div className="text-xs md:text-sm font-medium max-w-[60%]">
            low-poly fox, game-ready, side lit
          </div>
        </div>
        <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-accent text-accent-foreground text-[11px] font-mono font-semibold">
          <span className="size-1.5 rounded-full bg-accent-foreground/60" />
          31.4s
        </div>
      </motion.div>
    </div>
  );
});
