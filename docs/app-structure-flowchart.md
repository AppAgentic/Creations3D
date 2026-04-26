# Creations3D App Structure

```mermaid
flowchart TD
  Visitor[Visitor] --> Landing[Landing page /]
  Landing --> Pricing[Pricing /pricing<br/>Creator + Studio only]
  Landing --> Generate[Generator /generate]
  Landing --> Dashboard[Asset library /dashboard]

  Pricing --> Whop[Whop checkout]
  Whop --> WhopWebhook[/api/webhooks/whop]
  WhopWebhook --> FirestoreUsers[(Firestore users<br/>credits + plan + subscription)]

  Generate --> Auth[Firebase Google auth]
  Auth --> FirebaseClient[Firebase client auth context]

  Generate --> TextMode[Text prompt mode]
  Generate --> ImageMode[Image upload mode]
  Generate --> WorldMode[3D world mode]

  TextMode --> TextApi[/api/generate/text-to-3d]
  TextApi --> ReplicateShapeE[Replicate Shap-E]
  ReplicateShapeE --> ModelPreview[ModelViewer preview]

  ImageMode --> ImageApi[/api/generate/image-to-3d]
  ImageApi --> ReplicateTrellis[Replicate TRELLIS]
  ReplicateTrellis --> ModelPreview

  WorldMode --> WorldApi[/api/generate/world]
  WorldApi --> WorldLabs[World Labs Marble]
  WorldLabs --> WorldViewer[WorldViewer iframe + exports]

  ModelPreview --> SaveModel[/api/models/save]
  SaveModel --> R2[(Cloudflare R2 model storage)]

  Dashboard --> ListModels[/api/models/list]
  ListModels --> R2
  R2 --> SignedUrls[Signed/public model URLs]
  SignedUrls --> Dashboard

  Generate -. planned .-> CreditsApi[/api/user/credits]
  CreditsApi -. reads/writes .-> FirestoreUsers
```

## Current Completion Read

The product skeleton is in place: Next app routes, Firebase auth context, paid pricing UI, Whop webhook, text/image/world generation routes, model preview, save-to-library, R2 storage, dashboard listing, and the Studio Cockpit UI direction.

It is not production-complete yet. The main missing piece is server-side entitlement: generation APIs still need authenticated user validation, plan/credit checks before generation, and credit deduction after successful generation.

## Key Gaps

- No free plan: removed from pricing, comparison table, and default credit API behavior.
- Credit enforcement is incomplete: `/api/user/credits` exists, but text/image/world generation routes do not require credits yet.
- API auth is incomplete: model list/save/generate routes accept `userId` from client or fall back to `anonymous`; they should verify Firebase ID tokens server-side.
- Whop to Firebase mapping is incomplete: checkout passes Firebase UID metadata, but webhook currently writes by Whop user ID. It should write credits to the Firebase UID.
- Dashboard credits are hardcoded (`47`) instead of reading `/api/user/credits`.
- Generation metadata is not persisted in Firestore, so dashboard search/status/prompt history are mostly UI placeholders over R2 objects.
- Model delete, rename, version history, and export conversion are not implemented.
- Legal/support pages, production analytics, and admin/ops views are not implemented.
