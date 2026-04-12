"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const plans = [
  {
    name: "Basic",
    price: "$9.99",
    period: "/month",
    credits: 50,
    accent: "195",
    features: [
      "50 credits/month",
      "Text to 3D",
      "Image to 3D",
      "All export formats",
      "Priority queue",
      "Email support",
    ],
    cta: "Subscribe",
    popular: true,
    whopUrl:
      process.env.NEXT_PUBLIC_WHOP_BASIC_URL ||
      "https://whop.com/checkout/your-basic-plan",
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/month",
    credits: 150,
    accent: "290",
    features: [
      "150 credits/month",
      "Text to 3D",
      "Image to 3D",
      "3D World generation",
      "All export formats",
      "Priority queue",
      "High-quality mode",
      "Priority support",
      "API access",
    ],
    cta: "Subscribe",
    popular: false,
    whopUrl:
      process.env.NEXT_PUBLIC_WHOP_PRO_URL ||
      "https://whop.com/checkout/your-pro-plan",
  },
];

export default function PricingPage() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubscribe = async (plan: (typeof plans)[0]) => {
    if (!user) {
      try {
        await signInWithGoogle();
        toast.success("Signed in! Redirecting to checkout...");
      } catch {
        toast.error("Please sign in to subscribe");
        return;
      }
    }

    const checkoutUrl = new URL(plan.whopUrl);
    if (user?.email) checkoutUrl.searchParams.set("email", user.email);
    if (user?.uid) checkoutUrl.searchParams.set("metadata[firebase_uid]", user.uid);
    router.push(checkoutUrl.toString());
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[oklch(0.35_0.12_195_/_0.06)] blur-[140px]" />
      </div>

      <main className="relative pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-[12px] font-medium tracking-widest uppercase text-cyan mb-3">
              Pricing
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-[16px] text-muted-foreground max-w-md mx-auto">
              Choose the plan that fits your creative needs. No hidden fees.
            </p>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative glass-card rounded-2xl p-7 transition-all duration-300 hover:bg-[oklch(0.12_0.015_260_/_0.8)] ${
                  plan.popular ? "gradient-border" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-[11px] font-medium text-cyan">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-7 pt-2">
                  <h3 className="text-lg font-semibold mb-4">{plan.name}</h3>
                  <div>
                    <span className="text-4xl font-bold gradient-text">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-[14px]">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-2">
                    {plan.credits} credits per month
                  </p>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5"
                    >
                      <Check
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: `oklch(0.75 0.18 ${plan.accent})` }}
                      />
                      <span className="text-[13px] text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full h-10 text-[13px] font-medium ${
                    plan.popular ? "glow-sm hover:glow-md" : ""
                  } transition-all`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan)}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-[13px] text-muted-foreground mt-12">
            Need more credits?{" "}
            <span className="text-foreground font-medium">
              Pay-as-you-go: $0.50 per generation
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
