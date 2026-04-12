import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Hero3DWrapper } from "@/components/Hero3DWrapper";
import {
  Cuboid,
  Image,
  Type,
  Zap,
  Sparkles,
  ArrowRight,
  Globe,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />

      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(oklch(0.7 0.18 265 / 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, oklch(0.7 0.18 265 / 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Top glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[oklch(0.5_0.18_265_/_0.08)] blur-[120px]" />
        {/* Side accents */}
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-[oklch(0.5_0.2_300_/_0.05)] blur-[100px]" />
        <div className="absolute top-2/3 -right-40 w-[400px] h-[400px] rounded-full bg-[oklch(0.5_0.15_200_/_0.05)] blur-[100px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 glass glass-border text-[oklch(0.8_0.15_265)]">
            <Sparkles className="h-4 w-4" />
            AI-Powered 3D Generation
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-[0.95]">
            Create 3D Models
            <br />
            <span className="gradient-text">In Seconds</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Transform your ideas into stunning 3D models using AI. Simply
            describe what you want or upload an image, and watch the magic
            happen.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base glow-sm hover:glow-md transition-shadow" asChild>
              <Link href="/generate">
                Start Creating <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border/50 hover:bg-accent/50" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>

          {/* Interactive 3D Hero Scene */}
          <div className="relative mt-12 h-[350px] md:h-[420px] w-full max-w-3xl mx-auto">
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <Hero3DWrapper />
            </div>
            {/* Fade edges into background */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{
              background: `radial-gradient(ellipse at center, transparent 40%, oklch(0.09 0.005 270) 75%)`
            }} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to create production-ready 3D assets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Type,
                title: "Text to 3D",
                description: "Describe your vision in words and our AI will bring it to life as a detailed 3D model.",
                color: "265",
              },
              {
                icon: Image,
                title: "Image to 3D",
                description: "Upload any image and convert it into a fully textured 3D model in seconds.",
                color: "300",
              },
              {
                icon: Globe,
                title: "3D Worlds",
                description: "Generate entire navigable 3D environments from text or image descriptions.",
                color: "200",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Generate production-ready 3D models in under 30 seconds with our optimized AI.",
                color: "60",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl p-6 glass glass-border hover:bg-[oklch(0.16_0.01_270_/_0.8)] transition-all duration-300"
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ background: `oklch(0.7 0.18 ${feature.color} / 0.12)` }}
                >
                  <feature.icon
                    className="h-6 w-6"
                    style={{ color: `oklch(0.7 0.18 ${feature.color})` }}
                  />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl glass glass-border p-10 md:p-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "50K+", label: "Models Created" },
                { value: "<30s", label: "Generation Time" },
                { value: "3", label: "AI Engines" },
                { value: "GLB/OBJ", label: "Export Formats" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            {/* CTA glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-[oklch(0.5_0.18_265_/_0.1)] blur-[80px]" />

            <div className="relative">
              <Cuboid className="h-14 w-14 text-[oklch(0.7_0.18_265)] mx-auto mb-6 animate-float" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Create Your First 3D Model?
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
                Join thousands of creators using Creations3D to bring their ideas
                to life. Start with 5 free credits today.
              </p>
              <Button size="lg" className="h-12 px-8 text-base glow-sm hover:glow-md transition-shadow" asChild>
                <Link href="/generate">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cuboid className="h-5 w-5 text-[oklch(0.7_0.18_265)]" />
            <span className="font-semibold text-sm">Creations3D</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Creations3D. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
