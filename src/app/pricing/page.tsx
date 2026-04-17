"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Check, ArrowUpRight, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type Plan = {
  name: string;
  price: string;
  period?: string;
  credits: number;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
  whopUrl: string | null;
  // layout
  layout: "narrow" | "featured" | "wide";
  id: "free" | "basic" | "pro";
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Starter",
    price: "$0",
    credits: 5,
    blurb: "Kick the tires without a card.",
    features: [
      "5 free renders",
      "Text & image to 3D",
      "GLB export",
      "Community Discord",
    ],
    cta: "Start free",
    whopUrl: null,
    layout: "narrow",
  },
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    period: "/mo",
    credits: 50,
    blurb: "For creators shipping weekly scenes & props.",
    features: [
      "50 credits / month",
      "Text, image & world modes",
      "GLB + FBX + OBJ export",
      "Priority render queue",
      "Unity / Unreal / Blender ready",
      "Email support",
    ],
    cta: "Subscribe",
    featured: true,
    whopUrl:
      process.env.NEXT_PUBLIC_WHOP_BASIC_URL ||
      "https://whop.com/checkout/your-basic-plan",
    layout: "featured",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19.99",
    period: "/mo",
    credits: 150,
    blurb:
      "Studios running prototype sprints and batch asset pipelines.",
    features: [
      "150 credits / month",
      "Everything in Basic",
      "High-quality world mode",
      "API access & webhooks",
      "Early access to new models",
      "Priority support",
    ],
    cta: "Subscribe",
    whopUrl:
      process.env.NEXT_PUBLIC_WHOP_PRO_URL ||
      "https://whop.com/checkout/your-pro-plan",
    layout: "wide",
  },
];

export default function PricingPage() {
  const { user, signInWithGoogle } = useAuth();

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.whopUrl) {
      window.location.href = "/generate";
      return;
    }
    if (!user) {
      try {
        await signInWithGoogle();
        toast.success("Signed in · redirecting");
      } catch {
        toast.error("Please sign in to subscribe");
        return;
      }
    }
    const checkoutUrl = new URL(plan.whopUrl);
    if (user?.email) checkoutUrl.searchParams.set("email", user.email);
    if (user?.uid)
      checkoutUrl.searchParams.set("metadata[firebase_uid]", user.uid);
    window.location.href = checkoutUrl.toString();
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />

      <main className="pt-28 md:pt-32 pb-20 px-4">
        <div className="mx-auto max-w-6xl">
          {/* Asymmetric header */}
          <div className="grid grid-cols-12 gap-6 items-end mb-16 md:mb-20">
            <div className="col-span-12 md:col-span-8">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-3">
                pricing · 03
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight text-balance">
                Pay per
                <br />
                <span className="relative">
                  render, not per seat.
                  <span className="absolute -bottom-2 left-0 w-40 h-[3px] bg-accent rounded-full" />
                </span>
              </h1>
            </div>
            <p className="col-span-12 md:col-span-4 text-sm text-muted-foreground leading-relaxed">
              One credit per mesh. World generation burns 3 – 5. Unused
              credits roll for 30 days. Cancel any time in a single click.
            </p>
          </div>

          {/* Zig-zag asymmetric stack */}
          <div className="space-y-4 md:space-y-5">
            {plans.map((plan, i) => (
              <PricingRow
                key={plan.id}
                plan={plan}
                index={i}
                onSubscribe={() => handleSubscribe(plan)}
              />
            ))}
          </div>

          {/* PAYG note */}
          <div className="mt-16 hairline-t pt-10 grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 md:col-span-8">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
                pay as you go
              </div>
              <p className="text-2xl font-display font-semibold tracking-tight">
                $0.50 per render, no subscription required.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Top up credits any time. Same API, same library, same export
                formats.
              </p>
            </div>
            <div className="col-span-12 md:col-span-4 md:justify-self-end">
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border text-sm hover:bg-surface-raised transition-colors"
              >
                Try it first
                <ArrowUpRight className="size-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

function PricingRow({
  plan,
  index,
  onSubscribe,
}: {
  plan: Plan;
  index: number;
  onSubscribe: () => void;
}) {
  // Zig-zag alignment: left / full-featured / right
  const alignment =
    plan.layout === "narrow"
      ? "md:col-start-1 md:col-span-7"
      : plan.layout === "featured"
      ? "md:col-start-1 md:col-span-12"
      : "md:col-start-5 md:col-span-8";

  const isFeatured = plan.featured;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        delay: index * 0.08,
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      className="grid grid-cols-12"
    >
      <div
        className={`col-span-12 ${alignment} relative rounded-3xl p-7 md:p-10 border transition-colors ${
          isFeatured
            ? "border-accent/60 bg-accent/[0.04]"
            : "border-border bg-surface hover:bg-surface-raised"
        }`}
      >
        {isFeatured && (
          <div className="absolute -top-3 left-8 inline-flex items-center gap-1.5 h-6 px-3 bg-accent text-accent-foreground rounded-full font-mono text-[10px] font-semibold uppercase tracking-wider">
            <Sparkles className="size-3" strokeWidth={2} />
            most picked
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left: name + price */}
          <div className="col-span-12 md:col-span-5">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">
              tier · 0{index + 1}
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">
              {plan.name}
            </h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display font-black text-5xl md:text-6xl tracking-tight tabular-nums">
                {plan.price}
              </span>
              {plan.period && (
                <span className="font-mono text-sm text-muted-foreground">
                  {plan.period}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-4 max-w-xs leading-relaxed">
              {plan.blurb}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 h-8 px-3 rounded-full border border-border font-mono text-xs">
              <span className="size-1.5 rounded-full bg-accent" />
              {plan.credits} credits
            </div>
          </div>

          {/* Right: features + CTA */}
          <div className="col-span-12 md:col-span-7 flex flex-col">
            <ul className="divide-y divide-border">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 py-2.5 text-sm first:pt-0"
                >
                  <Check
                    className={`size-4 shrink-0 ${
                      isFeatured ? "text-accent" : "text-muted-foreground"
                    }`}
                    strokeWidth={2}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                onClick={onSubscribe}
                className={`group inline-flex items-center gap-2 h-12 pl-5 pr-4 rounded-full text-sm font-semibold transition-all ${
                  isFeatured
                    ? "bg-accent text-accent-foreground hover:brightness-110"
                    : "border border-border hover:bg-surface-raised"
                }`}
              >
                {plan.cta}
                <span
                  className={`grid place-items-center size-7 rounded-full transition-transform group-hover:translate-x-0.5 ${
                    isFeatured ? "bg-black/15" : "bg-surface-raised"
                  }`}
                >
                  <ArrowUpRight className="size-4" strokeWidth={2} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
