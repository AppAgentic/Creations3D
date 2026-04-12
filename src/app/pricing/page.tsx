"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const plans = [
  {
    name: "Basic",
    price: "$9.99",
    period: "/month",
    credits: 50,
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
    whopUrl: process.env.NEXT_PUBLIC_WHOP_BASIC_URL || "https://whop.com/checkout/your-basic-plan",
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/month",
    credits: 150,
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
    whopUrl: process.env.NEXT_PUBLIC_WHOP_PRO_URL || "https://whop.com/checkout/your-pro-plan",
  },
];

export default function PricingPage() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubscribe = async (plan: (typeof plans)[0]) => {
    // If not logged in, prompt to sign in first
    if (!user) {
      try {
        await signInWithGoogle();
        toast.success("Signed in! Redirecting to checkout...");
      } catch {
        toast.error("Please sign in to subscribe");
        return;
      }
    }

    // Redirect to Whop checkout with user info
    const checkoutUrl = new URL(plan.whopUrl);
    if (user?.email) {
      checkoutUrl.searchParams.set("email", user.email);
    }
    if (user?.uid) {
      checkoutUrl.searchParams.set("metadata[firebase_uid]", user.uid);
    }

    router.push(checkoutUrl.toString());
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[oklch(0.5_0.18_265_/_0.06)] blur-[120px]" />
      </div>

      <main className="relative pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-muted-foreground">
              Choose the plan that works best for you. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 glass glass-border transition-all duration-300 hover:bg-[oklch(0.16_0.01_270_/_0.8)] ${
                  plan.popular ? "glow-md gradient-border" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-semibold mb-4">{plan.name}</h3>
                  <div>
                    <span className="text-4xl font-bold gradient-text">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {plan.credits} credits
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[oklch(0.7_0.18_265)] shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? "glow-sm" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan)}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <p className="text-muted-foreground">
              Need more credits?{" "}
              <span className="text-foreground font-medium">
                Pay-as-you-go: $0.50 per generation
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
