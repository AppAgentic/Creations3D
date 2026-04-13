import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Hero3DWrapper } from "@/components/Hero3DWrapper";
import { ArrowRight, Sparkles, Type, Image, Globe, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ═══ Hero ═══ */}
      <section className="pt-12 pb-16 px-6 md:px-10">
        <div className="max-w-[720px] mx-auto text-center" style={{ paddingTop: "100px" }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-aurora mb-7 px-3.5 py-1.5 rounded-full border border-[rgba(45,212,191,0.2)] bg-[rgba(45,212,191,0.05)]">
            <span className="w-[5px] h-[5px] rounded-full bg-aurora animate-pulse-dot" />
            AI 3D Model Generator
          </div>

          {/* Headline */}
          <h1 className="text-[52px] md:text-[64px] font-extrabold leading-[1.05] tracking-[-0.035em] text-white mb-5">
            Generate 3D Models
            <br />
            from <em className="not-italic gradient-text">Text & Images</em>
          </h1>

          {/* Subtitle */}
          <p className="text-[17px] text-[rgba(255,255,255,0.45)] max-w-[520px] mx-auto mb-9 leading-[1.65] font-normal">
            Create production-ready GLB and OBJ files in under 30 seconds.
            AI-powered text-to-3D and image-to-3D generation for game devs, architects, and designers.
          </p>

          {/* CTAs */}
          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              className="h-[46px] px-7 text-[14px] font-bold bg-aurora text-background hover:bg-aurora-hover transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(45,212,191,0.2)] rounded-lg"
              asChild
            >
              <Link href="/generate">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Generating
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-[46px] px-7 text-[14px] font-semibold bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:text-white rounded-lg"
              asChild
            >
              <Link href="/pricing">
                View Plans <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ 3D Viewport ═══ */}
      <section className="px-6 md:px-10 mb-24">
        <div className="max-w-[900px] mx-auto">
          <div className="relative aspect-video rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] overflow-hidden">
            {/* Ambient radial glows inside viewport */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse 300px 200px at 30% 40%, rgba(45,212,191,0.08), transparent), radial-gradient(ellipse 250px 180px at 70% 60%, rgba(99,102,241,0.06), transparent)"
            }} />
            {/* Grid */}
            <div className="absolute inset-0" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }} />
            {/* 3D scene */}
            <div className="absolute inset-0 z-10">
              <Hero3DWrapper />
            </div>
            {/* Labels */}
            <div className="absolute bottom-4 left-5 text-[11px] text-[rgba(255,255,255,0.2)] tracking-[0.08em] uppercase font-medium z-20">
              Perspective · 45°
            </div>
            <div className="absolute bottom-4 right-5 flex gap-2.5 text-[10px] font-semibold tracking-[0.06em] z-20">
              <span className="text-red-500">X</span>
              <span className="text-green-500">Y</span>
              <span className="text-blue-500">Z</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section className="px-6 md:px-10 mb-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[32px] font-bold text-white tracking-[-0.03em] mb-2.5">
              AI-Powered 3D Generation Tools
            </h2>
            <p className="text-[15px] text-[rgba(255,255,255,0.4)] max-w-[480px] mx-auto">
              Generate 3D models, textured meshes, and immersive environments using AI.
              Export to GLB, OBJ, and more.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Type, title: "Text to 3D Model", desc: "Type a description and generate a fully textured 3D model. Supports prompts for characters, objects, architecture, and more." },
              { icon: Image, title: "Image to 3D Model", desc: "Upload any photo or concept art and convert it into a detailed 3D mesh with PBR textures automatically." },
              { icon: Globe, title: "3D World Generation", desc: "Create navigable 3D environments and scenes from text or image prompts. Ideal for games and virtual experiences." },
              { icon: Zap, title: "30-Second Generation", desc: "Get production-ready 3D assets in under 30 seconds. Export as GLB or OBJ for use in Unity, Unreal, Blender, and more." },
            ].map((f) => (
              <div key={f.title} className="aurora-card rounded-xl p-6 md:p-7">
                <div className="w-9 h-9 rounded-lg bg-[rgba(45,212,191,0.08)] border border-[rgba(45,212,191,0.12)] flex items-center justify-center mb-4 text-aurora">
                  <f.icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="text-[15px] font-bold text-white tracking-[-0.01em] mb-2">{f.title}</h3>
                <p className="text-[13px] text-[rgba(255,255,255,0.4)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="px-6 md:px-10 mb-24">
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { value: "2.4M", label: "Models Generated" },
              { value: "30s", label: "Average Time" },
              { value: "12K+", label: "Active Creators" },
              { value: "4.9", label: "User Rating" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[36px] font-extrabold text-white tracking-[-0.03em] mb-1">
                  {s.value}
                </div>
                <div className="text-[13px] text-[rgba(255,255,255,0.35)] font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="px-6 md:px-10 mb-24">
        <div className="max-w-[560px] mx-auto">
          <div className="aurora-card rounded-2xl p-12 md:p-14 text-center">
            <h2 className="text-[28px] font-bold text-white tracking-[-0.02em] mb-3">
              Start Generating 3D Models Today
            </h2>
            <p className="text-[14px] text-[rgba(255,255,255,0.4)] mb-7">
              No 3D experience needed. Type a prompt or upload an image and get a
              downloadable 3D model in seconds.
            </p>
            <Button
              className="h-[46px] px-7 text-[14px] font-bold bg-aurora text-background hover:bg-aurora-hover transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(45,212,191,0.2)] rounded-lg"
              asChild
            >
              <Link href="/generate">Start for free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="px-6 md:px-10 py-10 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <span className="text-[12px] text-[rgba(255,255,255,0.25)]">
            &copy; {new Date().getFullYear()} Creations3D
          </span>
          <div className="flex gap-6">
            {["Terms", "Privacy", "Contact"].map((l) => (
              <Link key={l} href="#" className="text-[12px] text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.6)] transition-colors">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
