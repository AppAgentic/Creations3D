export const TEXT_TO_3D_CREDIT_COST = 8;
export const IMAGE_TO_3D_CREDIT_COST = 2;
export const WORLD_DRAFT_CREDIT_COST = 3;
export const WORLD_HIGH_CREDIT_COST = 5;

export const PLAN_CREDIT_COUNTS = {
  creator: 40,
  studio: 120,
  pro: 300,
} as const;

export const PLAN_PRICES_USD = {
  creator: 19.99,
  studio: 39.99,
  pro: 89.99,
} as const;

export const CREDIT_PACK_CREDIT_COUNTS = {
  starter_pack: 12,
} as const;

export const CREDIT_PACK_PRICES_USD = {
  starter_pack: 9.99,
} as const;

export type SubscriptionPlanKey = keyof typeof PLAN_CREDIT_COUNTS;
export type CreditPackKey = keyof typeof CREDIT_PACK_CREDIT_COUNTS;
export type CheckoutOfferKey = SubscriptionPlanKey | CreditPackKey;
