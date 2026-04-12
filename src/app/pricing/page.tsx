"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const plans = [
  {
    name: "Free",
    price: "$0",
    credits: 5,
    features: [
      "5 free generations",
      "Text to 3D",
      "Image to 3D",
      "GLB export",
      "Basic support",
    ],
    cta: "Get Started",
    popular: false,
    whopUrl: null,
  },
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
    // Replace with your actual Whop checkout URL
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
      "All export formats",
      "Priority queue",
      "High-quality mode",
      "Priority support",
      "API access",
    ],
    cta: "Subscribe",
    popular: false,
    // Replace with your actual Whop checkout URL
    whopUrl: process.env.NEXT_PUBLIC_WHOP_PRO_URL || "https://whop.com/checkout/your-pro-plan",
  },
];

export default function PricingPage() {
  const { user, signInWithGoogle } = useAuth();

  const handleSubscribe = async (plan: (typeof plans)[0]) => {
    // If no Whop URL, just go to generate page (free plan)
    if (!plan.whopUrl) {
      window.location.href = "/generate";
      return;
    }

    // If not logged in, prompt to sign in first
    if (!user) {
      try {
        await signInWithGoogle();
        toast.success("Signed in! Redirecting to checkout...");
      } catch (error) {
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

    window.location.href = checkoutUrl.toString();
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that works best for you. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? "border-primary shadow-lg relative" : ""}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    {plan.credits} credits
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
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
