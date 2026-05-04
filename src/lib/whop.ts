import Whop from "@whop/sdk";

type PlanKey = "creator" | "studio";

export type WhopCheckoutPlan = {
  key: PlanKey;
  title: string;
  priceUsd: number;
  credits: number;
  description: string;
};

export const WHOP_CHECKOUT_PLANS: Record<PlanKey, WhopCheckoutPlan> = {
  creator: {
    key: "creator",
    title: "Creations3D Creator",
    priceUsd: 9.99,
    credits: 50,
    description: "Monthly Creations3D plan with 50 generation credits.",
  },
  studio: {
    key: "studio",
    title: "Creations3D Studio",
    priceUsd: 19.99,
    credits: 150,
    description: "Monthly Creations3D plan with 150 generation credits.",
  },
};

type CreateCheckoutOptions = {
  planKey: PlanKey;
  userId: string;
  email?: string;
  redirectUrl: string;
  sourceUrl?: string;
};

type CheckoutResult = {
  purchaseUrl: string;
  checkoutId: string;
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
  return planKey === "creator" || planKey === "studio"
    ? WHOP_CHECKOUT_PLANS[planKey]
    : null;
}

export async function createWhopCheckout(
  options: CreateCheckoutOptions
): Promise<CheckoutResult> {
  const plan = WHOP_CHECKOUT_PLANS[options.planKey];
  const checkoutConfiguration =
    await getWhopClient().checkoutConfigurations.create({
      plan: {
        company_id: getWhopCompanyId(),
        currency: "usd",
        initial_price: 0,
        renewal_price: plan.priceUsd,
        billing_period: 30,
        plan_type: "renewal",
        trial_period_days: 0,
        title: plan.title,
        description: plan.description,
        product: {
          external_identifier: `creations3d-${plan.key}`,
          title: "Creations3D",
          description: "Generate production-ready 3D models and worlds.",
          collect_shipping_address: false,
        },
        internal_notes:
          "Created dynamically by Creations3D App Hosting checkout.",
      },
      allow_promo_codes: true,
      redirect_url: options.redirectUrl,
      source_url: options.sourceUrl,
      metadata: {
        app: "creations3d",
        firebase_uid: options.userId,
        email: options.email,
        creations3d_plan: plan.key,
        creations3d_credits: String(plan.credits),
        creations3d_purchase_type: "subscription",
      },
    });

  return {
    purchaseUrl: checkoutConfiguration.purchase_url,
    checkoutId: checkoutConfiguration.id,
    planId: checkoutConfiguration.plan?.id ?? "",
    plan,
  };
}
