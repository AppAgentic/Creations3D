import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { HeroCanvas } from "@/components/landing/HeroCanvas";
import { KineticMarquee } from "@/components/landing/KineticMarquee";
import {
  ArrowUpRight,
  Type,
  ImageIcon,
  Globe,
  Zap,
  Download,
  Boxes,
  Gauge,
  Box,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />

      {/* ── HERO · Asymmetric split ─────────────────────────────── */}
      <section className="pt-28 md:pt-32 pb-16 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 dotted-grid opacity-50 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 relative">
          <div className="grid grid-cols-12 gap-6 items-end">
            {/* Text left — 7 cols */}
            <div className="col-span-12 md:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground mb-8">
                <span className="size-1.5 rounded-full bg-accent pulse-ring relative">
                  <span className="absolute inset-0 rounded-full bg-accent" />
                </span>
                <span>v2 · shap-e + trellis + marble</span>
              </div>

              <h1 className="font-display font-black text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.9] tracking-tight text-balance">
                Generate 3D
                <br />
                Models from
                <br />
                <span className="relative inline-block">
                  Text &amp; Images
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    height="12"
                    viewBox="0 0 400 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 8 Q 100 2 200 6 T 398 5"
                      stroke="oklch(0.92 0.18 120)"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>

              <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Describe it, drop an image, or spin up an entire 3D world. Ship
                GLB, FBX &amp; OBJ with PBR textures — production-ready for
                Unity, Unreal and Blender in about 30 seconds.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  href="/generate"
                  className="group inline-flex items-center gap-2 h-12 pl-5 pr-4 bg-accent text-accent-foreground rounded-full font-medium text-sm hover:brightness-110 transition-all"
                >
                  Start generating
                  <span className="grid place-items-center size-7 rounded-full bg-black/15 group-hover:translate-x-0.5 transition-transform">
                    <ArrowUpRight className="size-4" strokeWidth={2} />
                  </span>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 h-12 px-5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                >
                  See pricing
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">from $9.99/mo</span>
                </Link>
              </div>

              {/* Metric strip, divide-y, no cards */}
              <div className="mt-14 grid grid-cols-3 divide-x divide-border max-w-xl">
                <div className="pr-6">
                  <div className="font-mono text-2xl font-semibold">
                    48,271
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    models shipped
                  </div>
                </div>
                <div className="px-6">
                  <div className="font-mono text-2xl font-semibold">
                    ~31s
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    median render
                  </div>
                </div>
                <div className="pl-6">
                  <div className="font-mono text-2xl font-semibold">3</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    export formats
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas right — 5 cols */}
            <div className="col-span-12 md:col-span-5 md:mt-0 mt-12">
              <HeroCanvas />
            </div>
          </div>
        </div>
      </section>

      {/* ── Kinetic marquee ─────────────────────────────────────── */}
      <KineticMarquee />

      {/* ── BENTO features (Row 1: 60/40, Row 2: asymmetric 3-col) ── */}
      <section className="py-20 md:py-28 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-12 gap-8 flex-wrap">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-3">
                01 · capabilities
              </div>
              <h2 className="font-display font-bold text-4xl md:text-6xl tracking-tight max-w-2xl text-balance">
                Three pipelines. One interface.
              </h2>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Each route pulls from a different state-of-the-art model —
              optimized for the input you already have.
            </p>
          </div>

          {/* Row 1 — 60/40 split */}
          <div className="grid grid-cols-12 gap-4 md:gap-5">
            <div className="col-span-12 md:col-span-7 group relative overflow-hidden rounded-2xl border border-border bg-surface p-7 md:p-10 min-h-[340px] hover:bg-surface-raised transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent mb-4">
                    <Type className="size-3.5" strokeWidth={1.5} />
                    text-to-3d
                  </div>
                  <h3 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-3">
                    Text to 3D Model
                  </h3>
                  <p className="text-muted-foreground max-w-md leading-relaxed">
                    Describe a hero sword, a low-poly duck, or a stylized
                    cottage — Shap-E meshes it with clean topology ready for
                    rigging.
                  </p>
                </div>
                <div className="font-mono text-xs text-muted-foreground tabular-nums">
                  1 credit
                </div>
              </div>

              {/* Floating wireframe mock */}
              <div className="absolute -bottom-8 -right-8 size-64 opacity-80 float pointer-events-none">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <g
                    stroke="oklch(0.92 0.18 120)"
                    strokeWidth="0.6"
                    fill="none"
                    opacity="0.9"
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <ellipse
                        key={`h-${i}`}
                        cx="100"
                        cy="100"
                        rx={70 - i * 2}
                        ry={70}
                        transform={`rotate(${i * 15} 100 100)`}
                      />
                    ))}
                  </g>
                </svg>
              </div>
            </div>

            <div className="col-span-12 md:col-span-5 group relative overflow-hidden rounded-2xl border border-border bg-surface p-7 md:p-10 min-h-[340px] hover:bg-surface-raised transition-colors">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent mb-4">
                <ImageIcon className="size-3.5" strokeWidth={1.5} />
                image-to-3d
              </div>
              <h3 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-3">
                Image to 3D Model
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Drop a PNG or JPG — TRELLIS reconstructs a full 360° mesh with
                PBR textures baked in.
              </p>
              <div className="mt-6 font-mono text-xs text-muted-foreground">
                1 credit · ~45s
              </div>

              {/* Dotted silhouette */}
              <div className="absolute bottom-4 right-4 size-32 rounded-xl border border-dashed border-accent/40 grid place-items-center">
                <div className="size-20 rounded-lg bg-gradient-to-br from-accent/20 to-transparent" />
              </div>
            </div>
          </div>

          {/* Row 2 — asymmetric 3-col */}
          <div className="grid grid-cols-12 gap-4 md:gap-5 mt-4 md:mt-5">
            <div className="col-span-12 md:col-span-4 rounded-2xl border border-border bg-surface p-7 min-h-[260px] flex flex-col justify-between">
              <div>
                <Globe
                  className="size-7 text-accent mb-4"
                  strokeWidth={1.5}
                />
                <h3 className="font-display font-bold text-2xl tracking-tight mb-2">
                  3D World Generation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  World Labs Marble spins full explorable environments from a
                  prompt or reference image.
                </p>
              </div>
              <div className="mt-6 hairline-t pt-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>3–5 credits</span>
                <span>marble engine</span>
              </div>
            </div>

            <div className="col-span-12 md:col-span-5 rounded-2xl border border-border bg-surface p-7 min-h-[260px] flex flex-col justify-between">
              <div>
                <Zap className="size-7 text-accent mb-4" strokeWidth={1.5} />
                <h3 className="font-display font-bold text-2xl tracking-tight mb-2">
                  30-Second Generation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Single-mesh jobs return in about half a minute — fast enough
                  to prototype a scene over a coffee break.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[72%] bg-accent rounded-full" />
                </div>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  31s
                </span>
              </div>
            </div>

            <div className="col-span-12 md:col-span-3 rounded-2xl border border-border bg-surface p-7 min-h-[260px] flex flex-col justify-between">
              <div>
                <Download
                  className="size-7 text-accent mb-4"
                  strokeWidth={1.5}
                />
                <h3 className="font-display font-bold text-2xl tracking-tight mb-2">
                  Export
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  GLB, FBX, OBJ with PBR maps.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {["GLB", "FBX", "OBJ", "PBR"].map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] px-2 py-1 rounded-md border border-border text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow strip ──────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 hairline-t">
        <div className="mx-auto max-w-7xl grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-3">
              02 · workflow
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-balance">
              Prompt. Preview. Ship.
            </h2>
            <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
              Every render drops into your library. Re-export any time — no
              regeneration fees, no regrets.
            </p>
          </div>

          <ol className="col-span-12 md:col-span-8 divide-y divide-border">
            {[
              {
                n: "01",
                t: "Write a prompt or drop an image",
                d: "Works with photographs, concept sketches, AI renders, or plain text.",
                icon: Boxes,
              },
              {
                n: "02",
                t: "Watch the mesh arrive in ~30 seconds",
                d: "Progressive preview so you can kill the job early if it’s wrong.",
                icon: Gauge,
              },
              {
                n: "03",
                t: "Download GLB, FBX or OBJ",
                d: "Drop it into Unity, Unreal, Blender, or Three.js immediately.",
                icon: Download,
              },
            ].map((step) => (
              <li
                key={step.n}
                className="flex items-start gap-6 py-6 first:pt-0 last:pb-0"
              >
                <div className="font-mono text-sm text-accent tabular-nums pt-1">
                  {step.n}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-xl tracking-tight">
                    {step.t}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.d}
                  </p>
                </div>
                <step.icon
                  className="size-5 text-muted-foreground mt-1 shrink-0"
                  strokeWidth={1.5}
                />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="relative rounded-3xl overflow-hidden border border-border bg-surface p-10 md:p-16 grid grid-cols-12 gap-6 items-center">
            <div className="absolute inset-0 dotted-grid opacity-40 pointer-events-none" />
            <div className="col-span-12 md:col-span-8 relative">
              <h2 className="font-display font-bold text-4xl md:text-6xl tracking-tight text-balance">
                Render your first model in the next 60 seconds.
              </h2>
              <p className="mt-5 text-muted-foreground max-w-lg text-sm">
                New accounts get 5 free credits. No card. No watermark.
              </p>
            </div>
            <div className="col-span-12 md:col-span-4 relative flex md:justify-end">
              <Link
                href="/generate"
                className="group inline-flex items-center gap-2 h-14 pl-6 pr-5 bg-accent text-accent-foreground rounded-full font-medium hover:brightness-110 transition-all"
              >
                Start free
                <span className="grid place-items-center size-9 rounded-full bg-black/15 group-hover:translate-x-0.5 transition-transform">
                  <ArrowUpRight className="size-5" strokeWidth={2} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="hairline-t py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-accent grid place-items-center">
              <Box
                className="size-3 text-accent-foreground"
                strokeWidth={2.5}
              />
            </div>
            <span className="font-display font-semibold text-sm">
              Creations3D
            </span>
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            © {new Date().getFullYear()} Creations3D · shipped with shap-e,
            trellis &amp; marble
          </p>
        </div>
      </footer>
    </div>
  );
}

