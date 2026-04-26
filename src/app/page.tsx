import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StudioScene } from "@/components/StudioScene";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Box,
  Download,
  FileImage,
  Gauge,
  Layers3,
  ScanLine,
  Type,
} from "lucide-react";

const workflow = [
  {
    label: "Text to mesh",
    detail: "Describe the asset, choose quality, and generate a first pass.",
    icon: Type,
  },
  {
    label: "Image to mesh",
    detail: "Upload a reference and convert shape, silhouette, and material cues.",
    icon: FileImage,
  },
  {
    label: "Export GLB",
    detail: "Save production-ready models for web, game engines, and pipelines.",
    icon: Download,
  },
];

const assets = [
  "chair",
  "helmet",
  "lamp",
  "drone shell",
  "sneaker sole",
  "game crate",
];

export default function HomePage() {
  return (
    <div className="studio-shell min-h-screen overflow-hidden text-white">
      <Navbar />

      <main>
        <section className="relative min-h-[100svh] overflow-hidden pt-16">
          <div className="absolute inset-0 studio-grid opacity-55" />
          <StudioScene className="absolute right-0 top-20 h-[68svh] min-h-[34rem] w-[92vw] md:w-[68vw]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#080a08_0%,rgba(8,10,8,0.94)_32%,rgba(8,10,8,0.42)_65%,rgba(8,10,8,0.08)_100%)]" />

          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1500px] flex-col justify-between px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-3xl pt-12 sm:pt-20">
              <p className="mb-5 inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                <ScanLine className="size-3.5" />
                Text and image to 3D
              </p>
              <h1 className="font-display text-6xl font-black leading-[0.9] tracking-normal text-balance sm:text-7xl lg:text-8xl">
                Creations3D
              </h1>
              <p className="mt-6 max-w-xl text-xl leading-8 text-white/72 sm:text-2xl">
                Generate 3D models from prompts, references, and rough product
                ideas. Review the mesh, refine materials, then export to your
                pipeline.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-12 rounded-none px-6">
                  <Link href="/generate">
                    Start creating
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 rounded-none border-white/14 bg-white/[0.03] px-6 text-white hover:bg-white/[0.08] hover:text-white"
                >
                  <Link href="/dashboard">View examples</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              {workflow.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href="/generate"
                    className="group bg-[#0c0f0c]/88 p-5 transition-colors hover:bg-[#111710]"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <Icon className="size-5 text-primary" />
                      <ArrowRight className="size-4 text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <h2 className="font-display text-2xl font-black">
                      {item.label}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">
                      {item.detail}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0b0e0b] px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                Output gallery
              </p>
              <h2 className="mt-4 font-display text-5xl font-black leading-none text-balance lg:text-6xl">
                A library that looks like the work, not a file dump.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/60">
                Generated models land with status, format, prompt lineage, and
                export controls visible from the first scan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              {assets.map((asset, index) => (
                <div
                  key={asset}
                  className={`min-h-44 bg-[#111510] p-4 ${
                    index === 1 ? "md:row-span-2" : ""
                  }`}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="relative min-h-28 overflow-hidden bg-[#080a08]">
                      <div className="absolute inset-0 studio-grid opacity-40" />
                      <div className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rotate-12 border border-primary/65 bg-white/[0.04] shadow-[0_0_40px_rgba(201,255,56,0.08)]" />
                      <div className="absolute left-1/2 top-1/2 size-10 -translate-x-[25%] -translate-y-[30%] border border-white/25 bg-white/[0.08]" />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/72">
                        {asset}
                      </p>
                      <span className="text-xs text-primary">Ready</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
                {[
                  ["47.2s", "median model pass"],
                  ["3", "export formats"],
                  ["12k", "target poly preview"],
                ].map(([value, label]) => (
                  <div key={label} className="bg-[#0c0f0c] p-6">
                    <p className="font-mono text-4xl text-white">{value}</p>
                    <p className="mt-2 text-sm text-white/48">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-px border border-white/10 bg-white/10 md:grid-cols-2">
                <div className="bg-[#0c0f0c] p-6">
                  <Layers3 className="mb-12 size-6 text-primary" />
                  <h3 className="font-display text-3xl font-black">
                    Mesh review
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Inspect topology, preview wireframe, and choose an export
                    target before downloading.
                  </p>
                </div>
                <div className="bg-[#0c0f0c] p-6">
                  <Gauge className="mb-12 size-6 text-primary" />
                  <h3 className="font-display text-3xl font-black">
                    Credit control
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Keep cost, quality, and generation mode visible at the point
                    of creation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between border-l border-white/10 pl-8">
              <div>
                <Box className="mb-8 size-10 text-primary" />
                <h2 className="font-display text-5xl font-black leading-none text-balance lg:text-6xl">
                  Built around the workspace.
                </h2>
                <p className="mt-6 text-lg leading-8 text-white/62">
                  The landing page, generator, library, and pricing all share
                  one product language: a live 3D cockpit with the next action
                  always visible.
                </p>
              </div>
              <Button asChild className="mt-10 h-12 w-fit rounded-none px-6">
                <Link href="/generate">
                  Open the cockpit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-sm text-white/45 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-4 md:flex-row">
          <p>Creations3D</p>
          <div className="flex gap-5">
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/generate" className="hover:text-white">
              Generate
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              Assets
            </Link>
            <Link href="/support" className="hover:text-white">
              Support
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
