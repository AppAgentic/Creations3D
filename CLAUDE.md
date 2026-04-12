# Creations3D

## Overview
AI-powered 3D model generation web app. Users can generate 3D assets from text prompts, images, or create navigable 3D worlds.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix UI primitives)
- **3D Rendering**: Three.js + React Three Fiber + @react-three/drei
- **Auth**: Firebase Auth (Google OAuth)
- **Database**: Firestore (users, credits, webhook events)
- **File Storage**: Cloudflare R2 (S3-compatible, model persistence)
- **AI/ML**: Replicate API (Shap-E, TRELLIS) + World Labs Marble API
- **Payments**: Whop (subscriptions + credit packs)
- **Hosting**: Firebase App Hosting

## Project Structure
```
src/
  app/
    page.tsx                          # Landing page
    layout.tsx                        # Root layout with Providers + Toaster
    generate/page.tsx                 # Main generation UI (text→3D, image→3D, world)
    dashboard/page.tsx                # User model library + stats
    pricing/page.tsx                  # Tiered plans via Whop checkout
    api/
      generate/
        text-to-3d/route.ts          # Replicate Shap-E (auth + credits required)
        image-to-3d/route.ts         # Replicate TRELLIS (auth + credits required)
        world/route.ts               # World Labs Marble (auth + credits required)
      models/
        save/route.ts                # Save model to R2 (SSRF-protected allowlist)
        list/route.ts                # List user's saved models from R2
      user/credits/route.ts          # GET balance / POST deduct (atomic transaction)
      webhooks/whop/route.ts         # Whop payment webhooks (idempotent)
  lib/
    auth.ts                           # Server-side auth middleware (verifyIdToken)
    auth-context.tsx                  # Client-side Firebase Auth provider
    api-client.ts                     # Client-side authenticated fetch helper
    credits.ts                        # Atomic credit deduction via Firestore transactions
    firebase.ts                       # Client Firebase SDK init
    firebase-admin.ts                 # Server Firebase Admin SDK init
    replicate.ts                      # Replicate API client (Shap-E, TRELLIS, Hunyuan3D)
    worldlabs.ts                      # World Labs Marble API client
    r2.ts                             # Cloudflare R2 upload/download/signed URLs
  components/
    Navbar.tsx                        # Auth UI + navigation
    ModelViewer.tsx                    # Three.js GLB viewer (dynamic import)
    WorldViewer.tsx                    # Embedded World Labs iframe viewer
    Providers.tsx                     # Context providers wrapper
    ui/                               # shadcn/ui components
```

## Key Architecture Patterns
- **Auth**: All API routes (except webhooks) require Firebase ID token via `Authorization: Bearer <token>`. Server derives `uid` — never trust client-supplied `userId`.
- **Credits**: Deduction uses Firestore transactions (`runTransaction`) to prevent race conditions.
- **SSRF Protection**: `/api/models/save` only fetches from an allowlist of trusted hosts (replicate.delivery, worldlabs.ai).
- **Webhook Idempotency**: Whop webhooks are deduplicated via `processed_webhooks` Firestore collection.
- **Identity Mapping**: Webhook uses `metadata.firebase_uid` from Whop to map to Firebase user docs.
- **Dynamic Imports**: ModelViewer/WorldViewer use `next/dynamic` to avoid Three.js SSR issues.
- **World Gen Timeout**: Plus model returns `operationId` for client-side polling instead of blocking server.

## Commands
```bash
npm run dev    # Local development
npm run build  # Production build (note: requires tw-animate-css package)
npm run lint   # ESLint
```

## Known Issues
- `npm run build` fails due to missing `tw-animate-css` dependency in `globals.css` (pre-existing)
- World generation Plus model requires client-side polling (async response with operationId)

## Environment Variables
See `.env.example` for full list. Key ones:
- `REPLICATE_API_TOKEN` — Replicate API for 3D generation
- `WORLDLABS_API_KEY` — World Labs Marble API
- `R2_*` — Cloudflare R2 storage credentials
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config
- `FIREBASE_ADMIN_*` — Firebase Admin SDK (local dev only, ADC in prod)
- `WHOP_API_KEY` / `WHOP_WEBHOOK_SECRET` — Payment processing
- `NEXT_PUBLIC_WHOP_BASIC_URL` / `NEXT_PUBLIC_WHOP_PRO_URL` — Checkout URLs

## Credit Costs
- Text-to-3D: 1 credit
- Image-to-3D: 1 credit
- World (Mini/Draft): 3 credits
- World (Plus/HQ): 5 credits
- Free tier: 5 credits, Basic: 50/month, Pro: 150/month
