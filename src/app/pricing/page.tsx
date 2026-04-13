"use client";

import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const plans = [
  {
    name: "Basic",
    price: "9.99",
    credits: 50,
    popular: true,
    whopUrl: "https://whop.com/checkout/plan_basic",
    features: [
      "50 Credits per month",
      "Standard generation speed",
      "High-quality 3D models",
      "Commercial usage rights"
    ]
  },
  {
    name: "Pro",
    price: "19.99",
    credits: 150,
    popular: false,
    whopUrl: "https://whop.com/checkout/plan_pro",
    features: [
      "150 Credits per month",
      "Fast generation speed",
      "Ultra-high quality 3D models",
      "Priority support",
      "Commercial usage rights"
    ]
  }
];

export default function PricingPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();

  const handleSubscribe = async (whopUrl: string) => {
    try {
      if (!user) {
        try {
          await signInWithGoogle();
          toast.success("Signed in! Redirecting to checkout...");
        } catch {
          toast.error("Please sign in to subscribe");
          return;
        }
      }

      const url = new URL(whopUrl);
      if (user?.email) {
        url.searchParams.append("email", user.email);
      }
      if (user?.uid) {
        url.searchParams.append("metadata[firebase_uid]", user.uid);
      }

      router.push(url.toString());
    } catch (error) {
      toast.error("Failed to process subscription. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Simple, transparent pricing</h1>
          <p className="text-muted-foreground text-lg">Choose the perfect plan for your 3D creation needs.</p>
        </div>

        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 rounded-2xl bg-card shadow-md ${
                plan.popular ? "ring-1 ring-cyan-500" : "border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.credits} credits included</p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-cyan-500 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.whopUrl)}
                className={`w-full ${plan.popular ? "bg-cyan-500 hover:bg-cyan-600 text-white" : ""}`}
                variant={plan.popular ? "default" : "outline"}
              >
                Subscribe
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground text-center">
          Pay-as-you-go: $0.50 per generation
        </p>
      </main>
    </div>
  );
}
