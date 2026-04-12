import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import {
  Cuboid,
  Image,
  Type,
  Download,
  Zap,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered 3D Generation
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Create 3D Models
            <br />
            <span className="text-primary">In Seconds</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Transform your ideas into stunning 3D models using AI. Simply
            describe what you want or upload an image, and watch the magic
            happen.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/generate">
                Start Creating <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Type className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Text to 3D</h3>
                <p className="text-muted-foreground">
                  Describe your vision in words and our AI will bring it to
                  life as a detailed 3D model.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Image className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Image to 3D</h3>
                <p className="text-muted-foreground">
                  Upload any image and convert it into a fully textured 3D
                  model in seconds.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Multiple Formats</h3>
                <p className="text-muted-foreground">
                  Export your models in GLB, OBJ, or STL formats for use in any
                  3D application.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Generate production-ready 3D models in under 30 seconds with
                  our optimized AI pipeline.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Cuboid className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">
            Ready to Create Your First 3D Model?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of creators using Creations3D to bring their ideas
            to life. Start with free credits today.
          </p>
          <Button size="lg" asChild>
            <Link href="/generate">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cuboid className="h-6 w-6 text-primary" />
            <span className="font-semibold">Creations3D</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Creations3D. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
