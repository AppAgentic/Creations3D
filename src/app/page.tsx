import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Hero3DWrapper } from "@/components/Hero3DWrapper";
import { Cuboid, Image, Type, Zap, Globe, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-cyan/30 selection:text-cyan-foreground overflow-x-hidden">
      <Navbar />

      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 md:pt-48 md:pb-32 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 text-cyan text-sm font-medium mb-8 border border-cyan/20">
            <Sparkles className="h-4 w-4" />
            <span>Next-gen 3D generation is here</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-foreground">
            Create 3D Models <br />
            <span className="gradient-text">In Seconds</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 tracking-tight">
            Transform text prompts and 2D images into production-ready 3D assets. 
            Powered by advanced AI for creators, developers, and studios.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-cyan text-black hover:bg-cyan/90 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all" asChild>
              <Link href="/generate">
                Start Generating <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted/50" asChild>
              <Link href="/dashboard">View Library</Link>
            </Button>
          </div>
        </section>

        {/* 3D Scene Viewer */}
        <section className="px-4 max-w-6xl mx-auto mb-32">
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-sm shadow-2xl">
            {/* Radial fade overlay */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-10" />
            <div className="absolute inset-0 z-0">
              <Hero3DWrapper />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 max-w-5xl mx-auto mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex flex-col items-center text-center">
              <span className="text-3xl font-bold tracking-tighter text-foreground">50K+</span>
              <span className="text-sm font-medium text-muted-foreground mt-1">Models Generated</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-3xl font-bold tracking-tighter text-foreground">&lt;30s</span>
              <span className="text-sm font-medium text-muted-foreground mt-1">Average Time</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-3xl font-bold tracking-tighter text-foreground">3</span>
              <span className="text-sm font-medium text-muted-foreground mt-1">AI Engines</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-3xl font-bold tracking-tighter text-foreground">GLB/OBJ</span>
              <span className="text-sm font-medium text-muted-foreground mt-1">Export Formats</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 max-w-7xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">Built for performance</h2>
            <p className="text-muted-foreground">Everything you need to scale your 3D asset pipeline.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Type,
                title: "Text to 3D",
                description: "Describe what you want and watch it come to life in full 3D geometry.",
              },
              {
                icon: Image,
                title: "Image to 3D",
                description: "Convert any 2D image into a highly detailed 3D model automatically.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Optimized pipelines deliver your models in seconds, not hours.",
              },
              {
                icon: Globe,
                title: "Web Ready",
                description: "Export optimized GLB files ready for AR, VR, and web deployment.",
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-cyan/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-cyan" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 max-w-4xl mx-auto mb-32 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">Ready to create?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of creators building the next generation of spatial computing experiences.
          </p>
          <Button size="lg" className="h-12 px-8 text-base bg-cyan text-black hover:bg-cyan/90 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all" asChild>
            <Link href="/generate">Start for free</Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Cuboid className="h-5 w-5 text-cyan" />
            <span className="font-semibold tracking-tight text-foreground">Creations3D</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Creations3D. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
