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
  TextApi --> AuthGate[Firebase ID token check]
  AuthGate --> CreditReserve[Credit reserve + ledger event]
  CreditReserve --> FirestoreUsers
  TextApi --> ReplicateShapeE[Replicate Shap-E]
  ReplicateShapeE --> ModelPreview[ModelViewer preview]
  ReplicateShapeE --> GenerationMeta[(Firestore generations)]

  ImageMode --> ImageApi[/api/generate/image-to-3d]
  ImageApi --> AuthGate
  ImageApi --> ReplicateTrellis[Replicate TRELLIS]
  ReplicateTrellis --> ModelPreview
  ReplicateTrellis --> GenerationMeta

  WorldMode --> WorldApi[/api/generate/world]
  WorldApi --> AuthGate
  WorldApi --> WorldLabs[World Labs Marble]
  WorldLabs --> WorldViewer[WorldViewer iframe + exports]
  WorldLabs --> GenerationMeta

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

  Generate --> CreditsApi[/api/user/credits]
  Dashboard --> CreditsApi
  CreditsApi --> AuthGate
  CreditsApi --> FirestoreUsers

  Dashboard --> DeleteModel[/api/models/delete]
  DeleteModel --> AuthGate
  DeleteModel --> R2
  DeleteModel --> GenerationMeta
```

## Current Completion Read

The product skeleton and paid-access core are in place: Next app routes, Firebase auth context, paid pricing UI, Whop webhook, authenticated text/image/world generation routes, model preview, credit reservation/deduction/refund, save-to-library, R2 storage, dashboard listing, model deletion, Firestore generation metadata, and the Studio Cockpit UI direction.

It is closer to production-complete, but still needs live-provider QA and business/legal finishing before launch.

## Key Gaps

- Live QA still needed against real Firebase, Whop, Replicate, World Labs, and R2 credentials.
- Whop metadata shape should be confirmed in production webhooks; the handler now reads several common Firebase UID metadata locations.
- Rename, version history UI, and true export conversion are not implemented.
- Privacy, terms, and support placeholder pages exist, but legal copy and production support contact still need owner review.
- Production analytics and admin/ops views are not implemented.
