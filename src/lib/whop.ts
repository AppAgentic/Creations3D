import Whop from "@whop/sdk";
import crypto from "crypto";
import {
  CREDIT_PACK_CREDIT_COUNTS,
  CREDIT_PACK_PRICES_USD,
  type CheckoutOfferKey,
  PLAN_CREDIT_COUNTS,
  PLAN_PRICES_USD,
} from "@/lib/generation-costs";

export type WhopCheckoutPlan = {
  key: CheckoutOfferKey;
  kind: "subscription" | "credit_pack";
  title: string;
  priceUsd: number;
  credits: number;
  description: string;
};

export const WHOP_CHECKOUT_PLANS: Record<CheckoutOfferKey, WhopCheckoutPlan> = {
  creator: {
    key: "creator",
    kind: "subscription",
    title: "Creations3D Creator",
    priceUsd: PLAN_PRICES_USD.creator,
    credits: PLAN_CREDIT_COUNTS.creator,
    description: "Monthly Creations3D plan with 40 generation credits.",
  },
  studio: {
    key: "studio",
    kind: "subscription",
    title: "Creations3D Studio",
    priceUsd: PLAN_PRICES_USD.studio,
    credits: PLAN_CREDIT_COUNTS.studio,
    description: "Monthly Creations3D plan with 120 generation credits.",
  },
  pro: {
    key: "pro",
    kind: "subscription",
    title: "Creations3D Pro",
    priceUsd: PLAN_PRICES_USD.pro,
    credits: PLAN_CREDIT_COUNTS.pro,
    description: "Monthly Creations3D plan with 300 generation credits.",
  },
  starter_pack: {
    key: "starter_pack",
    kind: "credit_pack",
    title: "Creations3D Starter Pack",
    priceUsd: CREDIT_PACK_PRICES_USD.starter_pack,
    credits: CREDIT_PACK_CREDIT_COUNTS.starter_pack,
    description:
      "One-time Creations3D starter pack with 12 generation credits.",
  },
};

type CreateCheckoutOptions = {
  planKey: CheckoutOfferKey;
  userId: string;
  email?: string;
  redirectUrl: string;
  sourceUrl?: string;
};

type CheckoutResult = {
  purchaseUrl: string;
  checkoutId: string;
  purchaseId: string;
  planId: string;
  plan: WhopCheckoutPlan;
};

let client: Whop | null = null;

function getWhopClient(): Whop {
  if (client) return client;

  const apiKey = process.env.WHOP_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("WHOP_API_KEY not set");
  }

  client = new Whop({ apiKey });
  return client;
}

function getWhopCompanyId(): string {
  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  if (!companyId) {
    throw new Error("WHOP_COMPANY_ID not set");
  }

  return companyId;
}

export function getWhopCheckoutPlan(planKey: string): WhopCheckoutPlan | null {
  if (
    planKey === "creator" ||
    planKey === "studio" ||
    planKey === "pro" ||
    planKey === "starter_pack"
  ) {
    return WHOP_CHECKOUT_PLANS[planKey];
  }

  return null;
}

export async function createWhopCheckout(
  options: CreateCheckoutOptions
): Promise<CheckoutResult> {
  const plan = WHOP_CHECKOUT_PLANS[options.planKey];
  const purchaseId = crypto.randomUUID();
  const whopPlan =
    plan.kind === "subscription"
      ? {
          company_id: getWhopCompanyId(),
          currency: "usd" as const,
          initial_price: 0,
          renewal_price: plan.priceUsd,
          billing_period: 30,
          plan_type: "renewal" as const,
          trial_period_days: 0,
          title: plan.title,
          description: plan.description,
          product: {
            external_identifier: `creations3d-${plan.key}`,
            title: "Creations3D",
            description: "Generate production-ready 3D models.",
            collect_shipping_address: false,
          },
          internal_notes:
            "Created dynamically by Creations3D App Hosting checkout.",
        }
      : {
          company_id: getWhopCompanyId(),
          currency: "usd" as const,
          initial_price: plan.priceUsd,
          renewal_price: 0,
          billing_period: null,
          plan_type: "one_time" as const,
          trial_period_days: null,
          title: plan.title,
          description: plan.description,
          product: {
            external_identifier: `creations3d-${plan.key}`,
            title: "Creations3D",
            description: "Generate production-ready 3D models.",
            collect_shipping_address: false,
          },
          internal_notes:
            "Created dynamically by Creations3D App Hosting checkout.",
        };

  const checkoutConfiguration =
    await getWhopClient().checkoutConfigurations.create({
      plan: whopPlan,
      allow_promo_codes: true,
      redirect_url: options.redirectUrl,
      source_url: options.sourceUrl,
      metadata: {
        app: "creations3d",
        firebase_uid: options.userId,
        email: options.email,
        creations3d_plan: plan.key,
        creations3d_credits: String(plan.credits),
        creations3d_purchase_id: purchaseId,
        creations3d_purchase_type: plan.kind,
      },
    });

  return {
    purchaseUrl: checkoutConfiguration.purchase_url,
    checkoutId: checkoutConfiguration.id,
    purchaseId,
    planId: checkoutConfiguration.plan?.id ?? "",
    plan,
  };
}
