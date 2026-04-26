# Creations3D

## Overview
3D creation and design platform.

## Tech Stack
- **Framework**: Next.js
- **Database**: Firestore
- **Hosting**: Firebase App Hosting
- **Platform**: Web

## Project Structure
(To be filled as the project develops)

## Commands
```bash
npm run dev    # Local development
npm run build  # Production build
npm run lint   # ESLint
```

## Environment Variables
(To be filled)

## Operational Lessons

### AppAgentic Firebase / GCP provisioning
- For Firebase local env, Auth, Firestore, or App Hosting setup, use the AppAgentic gcloud service account first: `gcloud --configuration=app-agentic ...`. Do not start with Firebase CLI OAuth or a personal/Ruvix browser profile.
- If AppAgentic gcloud fails with quota-project/serviceusage permission errors, check and clear stale quota project config: `gcloud config unset billing/quota_project --configuration=app-agentic -q`, then retry.
- Use AppAgentic browser/OAuth only as a fallback for UI-only actions. Avoid `joe@ruvixlabs.com`/Ruvix for AppAgentic Firebase projects unless explicitly requested.
- Never paste secrets in Slack. Update `.env.local` locally and report only which keys were set plus validation status.
- Future workers can use shared skill `appagentic-firebase-provisioning` for the full workflow.

