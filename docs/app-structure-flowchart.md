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

  TextMode --> TextApi[/api/generate/text-to-3d]
  TextApi --> AuthGate[Firebase ID token check]
  AuthGate --> CreditReserve[Credit reserve + ledger event]
  CreditReserve --> FirestoreUsers
  TextApi --> ReplicateRodin[Replicate Rodin Gen-2]
  ReplicateRodin --> ModelPreview[ModelViewer preview]
  ReplicateRodin --> GenerationMeta[(Firestore generations)]

  ImageMode --> ImageApi[/api/generate/image-to-3d]
  ImageApi --> AuthGate
  ImageApi --> ReplicateTrellis[Replicate TRELLIS]
  ReplicateTrellis --> ModelPreview
  ReplicateTrellis --> GenerationMeta

  ModelPreview --> SaveModel[/api/models/save]
  SaveModel --> AuthGate
  SaveModel --> R2[(Cloudflare R2 model storage)]
  SaveModel --> GenerationMeta

  Dashboard --> ListModels[/api/models/list]
  ListModels --> AuthGate
  ListModels --> GenerationMeta
  GenerationMeta --> R2
  R2 --> SignedUrls[Signed/public model URLs]
  SignedUrls --> Dashboard
  Dashboard --> ModelDetail[Model detail /models/:generationId]
  ModelDetail --> AuthGate
  ModelDetail --> GenerationMeta
  SignedUrls --> ModelDetail

  Generate --> CreditsApi[/api/user/credits]
  Dashboard --> CreditsApi
  CreditsApi --> AuthGate
  CreditsApi --> FirestoreUsers

  Dashboard --> DeleteModel[/api/models/delete]
  DeleteModel --> AuthGate
  DeleteModel --> R2
  DeleteModel --> GenerationMeta

  Landing --> Analytics[Client analytics events]
  Pricing --> Analytics
  Generate --> Analytics
  Dashboard --> Analytics
```

## Current Completion Read

The product skeleton, paid-access core, and first conversion/retention pass are in place: Next app routes, Firebase auth context, paid pricing UI, Whop webhook, authenticated text/image model generation routes, Rodin Gen-2 text generation, model preview, credit reservation/deduction/refund, save-to-library, R2 storage, dashboard listing/search/delete, detail pages, Firestore generation metadata, Studio Cockpit UI direction, landing proof/FAQ/starter prompts, pricing credit math, returning-session prompts, and client analytics events.

It is closer to production-complete, but still needs live-provider QA and business/legal finishing before launch.

World generation code remains in the repo behind `NEXT_PUBLIC_WORLD_GENERATION_ENABLED` and the `/api/generate/world` route. It is hidden from public pricing/generator copy until `WORLDLABS_API_KEY` is available.

## Key Gaps

- Live QA still needed against real Firebase, Whop, Replicate, and R2 credentials.
- WorldLabs key/setup is still needed before exposing world generation.
- Whop metadata shape should be confirmed in production webhooks; the handler now reads several common Firebase UID metadata locations.
- Rename, version history UI, and true multi-format export conversion are not implemented.
- Privacy, terms, and support placeholder pages exist, but legal copy and production support contact still need owner review.
- Analytics events are instrumented client-side, but production analytics destination/reporting and admin/ops views are not implemented.
