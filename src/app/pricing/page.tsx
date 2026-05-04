"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
import {
  IMAGE_TO_3D_CREDIT_COST,
  PLAN_CREDIT_COUNTS,
  PLAN_PRICES_USD,
  TEXT_TO_3D_CREDIT_COST,
} from "@/lib/generation-costs";
import { toast } from "sonner";
import {
  ArrowRight,
  Calculator,
  Check,
  CreditCard,
  Layers3,
  ShieldCheck,
} from "lucide-react";

const plans = [
  {
    id: "creator",
    name: "Creator",
    price: `$${PLAN_PRICES_USD.creator}`,
    period: "/month",
    credits: `${PLAN_CREDIT_COUNTS.creator}`,
    creditCount: PLAN_CREDIT_COUNTS.creator,
    badge: "Start here",
    note: "For designers, makers, and solo creators.",
    math: "Up to 5 premium text models or 20 image models",
    features: [
      "40 credits per month",
      "Premium text-to-3D uses 8 credits",
      "Image-to-3D uses 2 credits",
      "Text and image generation",
      "Saved model library",
      "Model downloads",
      "Email support",
    ],
    cta: "Choose Creator",
    emphasis: "starter",
  },
  {
    id: "studio",
    name: "Studio",
    price: `$${PLAN_PRICES_USD.studio}`,
    period: "/month",
    credits: `${PLAN_CREDIT_COUNTS.studio}`,
    creditCount: PLAN_CREDIT_COUNTS.studio,
    badge: "Best value",
    note: "For teams shipping more assets.",
    math: "Up to 15 premium text models or 60 image models",
    features: [
      "120 credits per month",
      "Lower per-credit generation cost",
      "Premium text-to-3D uses 8 credits",
      "Image-to-3D uses 2 credits",
      "Text and image generation",
      "Saved model library",
      "Priority support",
    ],
    cta: "Choose Studio",
    emphasis: "primary",
  },
];

const confidenceItems = [
  "No free tier. Every generation uses your credits.",
  "Credits attach to the signed-in account you use at checkout.",
  "If generation fails, reserved credits are refunded automatically.",
];

const pricingFaqs = [
  [
    "Which plan should I choose?",
    "Creator is the lowest commitment. Studio is the better value if you expect to run batches of models.",
  ],
  [
    "Can I see the generator first?",
    "Yes. You can open the generator before paying, but actual generation requires a paid plan with credits.",
  ],
  [
    "How are credits used?",
    "Premium text-to-3D uses 8 credits. Image-to-3D uses 2 credits. World generation shows its credit cost before you run it.",
  ],
];

export default function PricingPage() {
  const { user, signInWithGoogle } = useAuth();

  const handleSubscribe = async (plan: (typeof plans)[0]) => {
    let checkoutUser = user;

    trackEvent("pricing_checkout_started", {
      plan: plan.name,
      credits: plan.credits,
      price: plan.price,
    });

    if (!user) {
      try {
        checkoutUser = await signInWithGoogle();
        toast.success("Signed in. Redirecting to checkout.");
        trackEvent("pricing_sign_in_completed", { plan: plan.name });
      } catch {
        toast.error("Sign in did not complete. Try again to subscribe.");
        trackEvent("pricing_sign_in_failed", { plan: plan.name });
        return;
      }
    }

    if (!checkoutUser) {
      toast.error("Sign in did not complete. Try again to subscribe.");
      trackEvent("pricing_sign_in_failed", { plan: plan.name });
      return;
    }

    try {
      const token = await checkoutUser.getIdToken();
      const response = await fetch("/api/whop/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: plan.id }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.purchaseUrl) {
        throw new Error(payload.error || "Checkout creation failed");
      }

      trackEvent("pricing_checkout_redirected", {
        plan: plan.name,
        hasFirebaseUid: Boolean(checkoutUser?.uid),
      });

      window.location.assign(payload.purchaseUrl);
    } catch {
      toast.error("Checkout did not open. Try again in a moment.");
      trackEvent("pricing_checkout_failed", { plan: plan.name });
    }
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
                Buy credits. Generate with intent.
              </h1>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-4">
                <CreditCard className="size-7 text-primary" />
                <div>
                  <p className="font-medium">No free plan. No hidden runs.</p>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    Every generation requires a paid account and shows the
                    credit cost before you spend.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-8 grid gap-px border border-white/10 bg-white/10 md:grid-cols-4">
            {[
              [
                "Premium text model",
                `${TEXT_TO_3D_CREDIT_COST} credits`,
                "prompt to high-quality 3D model",
              ],
              [
                "Image model",
                `${IMAGE_TO_3D_CREDIT_COST} credits`,
                "reference image to 3D model",
              ],
              ["Saved library", "Included", "store useful models"],
              [
                "Failed generation",
                "Refunded",
                "reserved credits returned automatically",
              ],
            ].map(([label, value, detail]) => (
              <div key={label} className="bg-[#0c0f0c] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/42">
                  {label}
                </p>
                <p className="mt-3 font-display text-4xl font-black text-white">
                  {value}
                </p>
                <p className="mt-2 text-sm text-white/50">{detail}</p>
              </div>
            ))}
          </section>

          <section className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`border p-5 ${
                  plan.emphasis === "primary"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/10 bg-white/[0.03]"
                } ${plan.emphasis === "starter" ? "lg:mt-14" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.22em] opacity-65">
                      {plan.name}
                    </p>
                    <p className="mt-3 inline-flex border border-current/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
                      {plan.badge}
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

                <p className="mt-5 min-h-12 text-sm leading-6 opacity-75">
                  {plan.note}
                </p>
                <div className="mt-5 space-y-2 border border-current/15 p-4 text-sm opacity-75">
                  <p className="flex gap-2">
                    <Calculator className="mt-0.5 size-4 shrink-0" />
                    {plan.math}
                  </p>
                  <p className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                    Credits are refunded automatically if generation fails.
                  </p>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm"
                    >
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
                  variant={
                    plan.emphasis === "primary" ? "secondary" : "outline"
                  }
                  onClick={() => handleSubscribe(plan)}
                >
                  {plan.cta}
                  <ArrowRight className="size-4" />
                </Button>
              </article>
            ))}
          </section>

          <section className="mt-14 border border-white/10 bg-white/[0.03]">
            <div className="grid gap-px bg-white/10 md:grid-cols-3">
              {[
                ["Feature", "Creator", "Studio"],
                ["Premium text-to-3D", "5 runs/month", "15 runs/month"],
                ["Image-to-3D", "20 runs/month", "60 runs/month"],
                ["Model downloads", "Included", "Included"],
                ["Best for", "solo creation", "batch creation"],
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

          <section className="mt-14 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="border border-white/10 bg-white/[0.03] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                Checkout confidence
              </p>
              <h2 className="mt-4 font-display text-4xl font-black leading-none">
                Know exactly what happens after checkout.
              </h2>
            </div>
            <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              {confidenceItems.map((item) => (
                <div key={item} className="bg-[#0c0f0c] p-5">
                  <Check className="mb-8 size-5 text-primary" />
                  <p className="text-sm leading-6 text-white/62">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 divide-y divide-white/10 border-y border-white/10">
            {pricingFaqs.map(([question, answer]) => (
              <div
                key={question}
                className="grid gap-4 py-6 md:grid-cols-[0.75fr_1.25fr]"
              >
                <h2 className="font-display text-2xl font-black">{question}</h2>
                <p className="leading-7 text-white/58">{answer}</p>
              </div>
            ))}
          </section>

          <section className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-4xl font-black">
                Ready to start generating?
              </h2>
              <p className="mt-2 text-white/55">
                Pick a paid plan, then open the generator with credits added to
                your signed-in account.
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
