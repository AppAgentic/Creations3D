"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ArrowRight, Check, CreditCard, Layers3 } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    credits: "5",
    note: "For testing the pipeline.",
    features: ["5 generations", "Text to 3D", "Image to 3D", "GLB export"],
    cta: "Start free",
    whopUrl: null,
    emphasis: "quiet",
  },
  {
    name: "Creator",
    price: "$9.99",
    period: "/month",
    credits: "50",
    note: "For designers, makers, and solo creators.",
    features: [
      "50 credits per month",
      "Text and image generation",
      "All export formats",
      "Priority queue",
      "Email support",
    ],
    cta: "Choose Creator",
    whopUrl:
      process.env.NEXT_PUBLIC_WHOP_BASIC_URL ||
      "https://whop.com/checkout/your-basic-plan",
    emphasis: "primary",
  },
  {
    name: "Studio",
    price: "$19.99",
    period: "/month",
    credits: "150",
    note: "For teams shipping more assets.",
    features: [
      "150 credits per month",
      "High-quality mode",
      "Priority queue",
      "API access",
      "Priority support",
    ],
    cta: "Contact sales",
    whopUrl:
      process.env.NEXT_PUBLIC_WHOP_PRO_URL ||
      "https://whop.com/checkout/your-pro-plan",
    emphasis: "studio",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();

  const handleSubscribe = async (plan: (typeof plans)[0]) => {
    if (!plan.whopUrl) {
      router.push("/generate");
      return;
    }

    if (!user) {
      try {
        await signInWithGoogle();
        toast.success("Signed in. Redirecting to checkout.");
      } catch {
        toast.error("Please sign in to subscribe");
        return;
      }
    }

    const checkoutUrl = new URL(plan.whopUrl);
    if (user?.email) {
      checkoutUrl.searchParams.set("email", user.email);
    }
    if (user?.uid) {
      checkoutUrl.searchParams.set("metadata[firebase_uid]", user.uid);
    }

    window.location.assign(checkoutUrl.toString());
  };

  return (
    <div className="studio-shell min-h-screen text-white">
      <Navbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <header className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                Pricing
              </p>
              <h1 className="mt-4 font-display text-6xl font-black leading-none text-balance lg:text-7xl">
                Upgrade your 3D pipeline.
              </h1>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-4">
                <CreditCard className="size-7 text-primary" />
                <div>
                  <p className="font-medium">Credits convert to generations.</p>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    Keep text, image, world generation, and export formats in
                    one workspace.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-10 grid gap-5 lg:grid-cols-[0.75fr_1.35fr_0.9fr] lg:items-start">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`border p-5 ${
                  plan.emphasis === "primary"
                    ? "border-primary bg-primary text-primary-foreground lg:mt-10"
                    : "border-white/10 bg-white/[0.03]"
                } ${plan.emphasis === "studio" ? "lg:mt-20" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.22em] opacity-65">
                      {plan.name}
                    </p>
                    <p className="mt-5 font-display text-5xl font-black">
                      {plan.price}
                      <span className="font-sans text-base font-medium opacity-60">
                        {plan.period}
                      </span>
                    </p>
                  </div>
                  <Layers3 className="size-6 opacity-70" />
                </div>

                <div className="mt-8 border-y border-current/15 py-5">
                  <p className="font-mono text-4xl">{plan.credits}</p>
                  <p className="mt-1 text-sm opacity-65">credits per month</p>
                </div>

                <p className="mt-5 min-h-12 text-sm leading-6 opacity-70">
                  {plan.note}
                </p>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className="size-4 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`mt-8 h-12 w-full rounded-none ${
                    plan.emphasis === "primary"
                      ? "bg-[#080a08] text-white hover:bg-[#111710]"
                      : ""
                  }`}
                  variant={plan.emphasis === "primary" ? "secondary" : "outline"}
                  onClick={() => handleSubscribe(plan)}
                >
                  {plan.cta}
                  <ArrowRight className="size-4" />
                </Button>
              </article>
            ))}
          </section>

          <section className="mt-14 border border-white/10 bg-white/[0.03]">
            <div className="grid gap-px bg-white/10 md:grid-cols-4">
              {[
                ["Feature", "Free", "Creator", "Studio"],
                ["Text to 3D", "Included", "Included", "Included"],
                ["Image to 3D", "Included", "Included", "Included"],
                ["Exports", "GLB", "GLB / USDZ / OBJ", "GLB / USDZ / OBJ"],
                ["Queue", "Standard", "Priority", "Priority"],
              ].map((row, rowIndex) =>
                row.map((cell, cellIndex) => (
                  <div
                    key={`${rowIndex}-${cellIndex}`}
                    className={`bg-[#0c0f0c] p-4 text-sm ${
                      rowIndex === 0
                        ? "font-mono uppercase tracking-[0.16em] text-white/48"
                        : cellIndex === 0
                          ? "text-white"
                          : "text-white/55"
                    }`}
                  >
                    {cell}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-4xl font-black">
                Need one model first?
              </h2>
              <p className="mt-2 text-white/55">
                Start in the cockpit and upgrade when the queue becomes real.
              </p>
            </div>
            <Button asChild className="h-12 rounded-none px-6">
              <Link href="/generate">
                Generate a model
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
