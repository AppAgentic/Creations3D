import Link from "next/link";
import { ArrowRight, Box } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="studio-shell min-h-screen text-white">
      <Navbar />
      <main className="flex min-h-screen items-center px-4 pt-20 sm:px-6 lg:px-8">
        <section className="mx-auto grid max-w-[1500px] gap-10 border-y border-white/10 py-16 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div className="border border-white/10 bg-white/[0.03] p-6">
            <Box className="size-10 text-primary" />
            <p className="mt-10 font-mono text-xs uppercase tracking-[0.24em] text-primary">
              Page not found
            </p>
            <h1 className="mt-4 font-display text-6xl font-black leading-none">
              This page does not exist.
            </h1>
          </div>
          <div>
            <p className="max-w-2xl text-xl leading-9 text-white/62">
              The page you opened does not exist. You can return to the
              generator, view paid plans, or open your saved model library.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-none px-6">
                <Link href="/generate">
                  Open generator
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-none border-white/10 bg-white/[0.03] px-6 text-white hover:bg-white/[0.08] hover:text-white"
              >
                <Link href="/pricing">View paid plans</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
