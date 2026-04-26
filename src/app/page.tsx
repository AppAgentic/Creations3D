import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StudioScene } from "@/components/StudioScene";
import { TrackedLink } from "@/components/TrackedLink";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  Box,
  CheckCircle2,
  Download,
  FileImage,
  Gauge,
  Layers3,
  ScanLine,
  ShieldCheck,
  TimerReset,
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

const proofPoints = [
  {
    value: "1",
    label: "credit for text or image mesh",
    detail: "No mystery spend at the moment of creation.",
  },
  {
    value: "47.2s",
    label: "typical first model preview",
    detail: "Fast enough to test several directions in one working session.",
  },
  {
    value: "3",
    label: "export formats in the workspace",
    detail: "Keep GLB, OBJ, and USDZ visible before the download step.",
  },
];

const promptExamples = [
  {
    prompt: "Graphite sci-fi helmet with ceramic faceplate",
    output: "hero prop",
    use: "game pitch",
  },
  {
    prompt: "Minimal desk lamp, brushed aluminum, fabric shade",
    output: "product mockup",
    use: "commerce render",
  },
  {
    prompt: "Compact inspection bay with concrete floor",
    output: "3D world",
    use: "scene preview",
  },
];

const faqs = [
  [
    "Is there a free plan?",
    "No. Creations3D is paid-only so generation credits, model storage, and support stay predictable.",
  ],
  [
    "What does one credit buy?",
    "A text-to-3D or image-to-3D model pass uses 1 credit. World generation uses 3 or 5 credits depending on quality.",
  ],
  [
    "Where do generated models go?",
    "Save finished models to the asset library, then review, download, or delete them from the dashboard.",
  ],
  [
    "What happens if generation fails?",
    "The app reserves credits first and refunds them if generation fails before a usable result is created.",
  ],
];

const trustSignals = [
  {
    icon: BadgeCheck,
    text: "Paid credits are checked before each run",
  },
  {
    icon: TimerReset,
    text: "Low credits show a clear refill path",
  },
  {
    icon: ShieldCheck,
    text: "Saved models remain tied to the user library",
  },
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
                Paid 3D asset studio
              </p>
              <h1 className="font-display text-6xl font-black leading-[0.9] tracking-normal text-balance sm:text-7xl lg:text-8xl">
                Turn ideas into usable 3D assets.
              </h1>
              <p className="mt-6 max-w-xl text-xl leading-8 text-white/72 sm:text-2xl">
                Generate product props, reference meshes, and 3D worlds from
                prompts or images. Know the credit cost before you run, then
                save the result to a real asset library.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-12 rounded-none px-6">
                  <TrackedLink
                    href="/pricing"
                    eventName="hero_primary_cta_clicked"
                    eventPayload={{ cta: "choose_plan" }}
                  >
                    Choose a plan
                    <ArrowRight className="size-4" />
                  </TrackedLink>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 rounded-none border-white/14 bg-white/[0.03] px-6 text-white hover:bg-white/[0.08] hover:text-white"
                >
                  <TrackedLink
                    href="#proof"
                    eventName="hero_secondary_cta_clicked"
                    eventPayload={{ cta: "see_proof" }}
                  >
                    See what credits buy
                  </TrackedLink>
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap gap-3 text-sm text-white/55">
                {[
                  "No free tier",
                  "1 credit text/image models",
                  "Library included",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              {workflow.map((item) => {
                const Icon = item.icon;
                return (
                  <TrackedLink
                    key={item.label}
                    href="/generate"
                    eventName="workflow_tile_clicked"
                    eventPayload={{ workflow: item.label }}
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
                  </TrackedLink>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="proof"
          className="border-y border-white/10 bg-[#0a0d0a] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                Clear before you create
              </p>
              <h2 className="mt-4 font-display text-5xl font-black leading-none text-balance lg:text-6xl">
                The credit cost is clear before the model runs.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/62">
                Know what each generation costs, where the output lands, and
                how to keep useful results before you spend a credit.
              </p>
            </div>

            <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              {proofPoints.map((point) => (
                <div key={point.label} className="bg-[#0c0f0c] p-6">
                  <p className="font-mono text-5xl text-white">
                    {point.value}
                  </p>
                  <h3 className="mt-5 font-display text-2xl font-black leading-tight">
                    {point.label}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/52">
                    {point.detail}
                  </p>
                </div>
              ))}
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
          <div className="mx-auto max-w-[1500px]">
            <div className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                  Try a prompt first
                </p>
                <h2 className="mt-4 font-display text-5xl font-black leading-none text-balance lg:text-6xl">
                  See what you can make before you buy.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-white/60">
                Start from concrete prompts, output types, and use cases that
                map to real creative work before you choose a plan.
              </p>
            </div>

            <div className="mt-8 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-[1.15fr_0.85fr_1fr]">
              {promptExamples.map((example, index) => (
                <TrackedLink
                  key={example.prompt}
                  href={`/generate?starter=${encodeURIComponent(example.prompt)}`}
                  eventName="starter_prompt_clicked"
                  eventPayload={{ prompt: example.prompt, surface: "landing" }}
                  className={`group bg-[#0c0f0c] p-6 transition-colors hover:bg-[#111710] ${
                    index === 1 ? "lg:mt-10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                      {example.output}
                    </span>
                    <ArrowRight className="size-4 text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="mt-10 text-xl leading-8 text-white">
                    “{example.prompt}”
                  </p>
                  <p className="mt-6 border-t border-white/10 pt-4 text-sm text-white/50">
                    Best for {example.use}
                  </p>
                </TrackedLink>
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
                  ["12k", "polygon target"],
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
                  Built for projects you come back to.
                </h2>
                <p className="mt-6 text-lg leading-8 text-white/62">
                  The generator, credit balance, asset library, and export
                  controls stay connected so you can review old work and start
                  the next model without re-learning the tool.
                </p>
                <div className="mt-8 space-y-4">
                  {trustSignals.map(({ icon: TrustIcon, text }) => {
                    return (
                      <div key={text} className="flex gap-3 text-sm text-white/58">
                        <TrustIcon className="mt-0.5 size-4 text-primary" />
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button asChild className="mt-10 h-12 w-fit rounded-none px-6">
                <TrackedLink
                  href="/pricing"
                  eventName="workspace_cta_clicked"
                  eventPayload={{ cta: "pricing_from_retention_section" }}
                >
                  Get credits
                  <ArrowRight className="size-4" />
                </TrackedLink>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                Buying questions
              </p>
              <h2 className="mt-4 font-display text-5xl font-black leading-none text-balance lg:text-6xl">
                Answers before checkout.
              </h2>
              <Button asChild className="mt-8 h-12 rounded-none px-6">
                <TrackedLink
                  href="/pricing"
                  eventName="faq_cta_clicked"
                  eventPayload={{ cta: "choose_paid_plan" }}
                >
                  Choose a paid plan
                  <ArrowRight className="size-4" />
                </TrackedLink>
              </Button>
            </div>

            <div className="divide-y divide-white/10 border-y border-white/10">
              {faqs.map(([question, answer]) => (
                <div key={question} className="grid gap-4 py-6 md:grid-cols-[0.8fr_1.2fr]">
                  <h3 className="font-display text-2xl font-black">
                    {question}
                  </h3>
                  <p className="text-base leading-7 text-white/58">{answer}</p>
                </div>
              ))}
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
