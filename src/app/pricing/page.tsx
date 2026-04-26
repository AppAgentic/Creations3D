"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
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
    name: "Creator",
    price: "$9.99",
    period: "/month",
    credits: "50",
    badge: "Start here",
    note: "For designers, makers, and solo creators.",
    math: "About $0.20 per text/image model pass",
    worlds: "Up to 16 draft worlds or 10 high-quality worlds",
    features: [
      "50 credits per month",
      "Text, image, and world generation",
      "Saved model library",
      "GLB model downloads",
      "Email support",
    ],
    cta: "Choose Creator",
    whopUrl:
      process.env.NEXT_PUBLIC_WHOP_BASIC_URL ||
      "https://whop.com/checkout/your-basic-plan",
    emphasis: "starter",
  },
  {
    name: "Studio",
    price: "$19.99",
    period: "/month",
    credits: "150",
    badge: "Best value",
    note: "For teams shipping more assets.",
    math: "About $0.13 per text/image model pass",
    worlds: "Up to 50 draft worlds or 30 high-quality worlds",
    features: [
      "150 credits per month",
      "Lower per-credit generation cost",
      "Text, image, and world generation",
      "Saved model library",
      "Priority support",
    ],
    cta: "Choose Studio",
    whopUrl:
      process.env.NEXT_PUBLIC_WHOP_PRO_URL ||
      "https://whop.com/checkout/your-pro-plan",
    emphasis: "primary",
  },
];

const confidenceItems = [
  "No free tier. Every run uses your credits.",
  "Credit cost is visible before every generation",
  "Checkout connects credits to your Creations3D account.",
];

const pricingFaqs = [
  [
    "Which plan should I choose?",
    "Creator is the lowest commitment. Studio is the better value if you expect to run batches or generate worlds.",
  ],
  [
    "Can I see the generator first?",
    "Yes. You can open the generator before paying, but actual generation requires a paid plan with credits.",
  ],
  [
    "How are credits used?",
    "Text-to-3D and image-to-3D use 1 credit. World generation uses 3 or 5 credits depending on the quality mode.",
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
        toast.error("Please sign in to subscribe");
        trackEvent("pricing_sign_in_failed", { plan: plan.name });
        return;
      }
    }

    const checkoutUrl = new URL(plan.whopUrl);
    if (checkoutUser?.email) {
      checkoutUrl.searchParams.set("email", checkoutUser.email);
    }
    if (checkoutUser?.uid) {
      checkoutUrl.searchParams.set("metadata[firebase_uid]", checkoutUser.uid);
    }

    trackEvent("pricing_checkout_redirected", {
      plan: plan.name,
      hasFirebaseUid: Boolean(checkoutUser?.uid),
    });

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
                Buy credits. Generate with intent.
              </h1>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-4">
                <CreditCard className="size-7 text-primary" />
                <div>
                  <p className="font-medium">No free plan. No hidden runs.</p>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    Every model run requires a paid account and shows the credit
                    cost before you spend.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-8 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
            {[
              ["Text or image model", "1 credit", "prompt or reference to mesh"],
              ["World draft", "3 credits", "faster scene exploration"],
              ["World high quality", "5 credits", "larger production pass"],
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
                    {plan.worlds}
                  </p>
                </div>

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
            <div className="grid gap-px bg-white/10 md:grid-cols-3">
              {[
                ["Feature", "Creator", "Studio"],
                ["Text to 3D", "Included", "Included"],
                ["Image to 3D", "Included", "Included"],
                ["World generation", "3 or 5 credits", "3 or 5 credits"],
                ["GLB downloads", "Included", "Included"],
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
                <h2 className="font-display text-2xl font-black">
                  {question}
                </h2>
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
                Pick a paid plan, then open the generator with credits ready.
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
