import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Hero3DWrapper } from "@/components/Hero3DWrapper";
import {
  Cuboid,
  Image,
  Type,
  Zap,
  Globe,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />

      {/* ═══ Ambient background ═══ */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(oklch(0.82 0.17 195 / 0.5) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full bg-[oklch(0.4_0.15_195_/_0.07)] blur-[150px]" />
        <div className="absolute top-[40%] -left-[200px] w-[500px] h-[500px] rounded-full bg-[oklch(0.4_0.2_290_/_0.04)] blur-[120px]" />
        <div className="absolute top-[60%] -right-[200px] w-[500px] h-[500px] rounded-full bg-[oklch(0.4_0.18_330_/_0.04)] blur-[120px]" />
      </div>

      {/* ═══ Hero ═══ */}
      <section className="relative pt-40 pb-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium tracking-wide uppercase glass-surface mb-10" style={{ animationDelay: "0.1s" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse-slow" />
            <span className="text-muted-foreground">AI-Powered 3D Generation</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-bold tracking-[-0.035em] leading-[0.92] mb-7">
            Create 3D Models
            <br />
            <span className="gradient-text">In Seconds</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[17px] md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Transform ideas into production-ready 3D assets.
            Describe what you want or upload an image.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-11 px-7 text-[14px] font-medium glow-sm hover:glow-md transition-all group"
              asChild
            >
              <Link href="/generate">
                Start Creating
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-7 text-[14px] font-medium border-border/40 hover:bg-accent/40"
              asChild
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ 3D Hero Scene ═══ */}
      <section className="relative px-4 -mt-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative h-[320px] md:h-[400px] rounded-3xl overflow-hidden">
            <Hero3DWrapper />
            {/* Fade edges */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, transparent 35%, oklch(0.065 0.01 260) 80%)`,
              }}
            />
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section className="relative py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-medium tracking-widest uppercase text-cyan mb-3">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need to create in 3D
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Type,
                title: "Text to 3D",
                desc: "Describe your vision in words and our AI brings it to life.",
                accent: "195",
              },
              {
                icon: Image,
                title: "Image to 3D",
                desc: "Upload any image and convert it into a textured 3D model.",
                accent: "290",
              },
              {
                icon: Globe,
                title: "3D Worlds",
                desc: "Generate navigable 3D environments from descriptions.",
                accent: "330",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Production-ready models in under 30 seconds.",
                accent: "85",
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className="group glass-card rounded-2xl p-5 hover:bg-[oklch(0.12_0.015_260_/_0.8)] transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `oklch(0.65 0.18 ${f.accent} / 0.12)` }}
                >
                  <f.icon
                    className="h-5 w-5"
                    style={{ color: `oklch(0.75 0.18 ${f.accent})` }}
                  />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="relative py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-10 md:p-12 gradient-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "50K+", label: "Models Created" },
                { value: "<30s", label: "Generation Time" },
                { value: "3", label: "AI Engines" },
                { value: "GLB/OBJ", label: "Export Formats" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">
                    {s.value}
                  </div>
                  <div className="text-[12px] text-muted-foreground tracking-wide">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-28 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-[oklch(0.4_0.15_195_/_0.06)] blur-[100px]" />
          <div className="relative">
            <Cuboid className="h-12 w-12 text-cyan mx-auto mb-6 animate-float" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Ready to create?
            </h2>
            <p className="text-muted-foreground text-[16px] mb-8 max-w-md mx-auto">
              Join thousands of creators bringing ideas to life in 3D.
            </p>
            <Button
              size="lg"
              className="h-11 px-7 text-[14px] font-medium glow-sm hover:glow-md transition-all group"
              asChild
            >
              <Link href="/generate">
                Get Started Free
                <Sparkles className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="relative border-t border-border/25 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cuboid className="h-4 w-4 text-cyan" />
            <span className="font-medium text-[13px]">Creations3D</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} Creations3D. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
