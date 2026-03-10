
---
description: Compakt coding agent rules
---

# Compakt Agent Rules

## Product And Stack Context

- **Project**: `compakt`
- **Frontend**: Next.js 14, React 18, TypeScript
- **State**: Zustand
- **Backend/Data**: Supabase
- **Deploy**: GitHub Actions to Google Cloud Run
- **Current couple auth direction**: email OTP, not phone/SMS
- **Current couple resume direction**: support event number + email OTP

## Working Style

- **Implement, don't only suggest**
  - If the request is clear, make the change instead of stopping at advice.

- **Map the real source of truth first**
  - Before editing, identify whether the data comes from `events`, `dj_events`, `event_sessions`, or client-side Zustand state.
  - Do not assume similarly named admin and couple flows share the same schema.

- **Prefer minimal schema disruption**
  - Reuse existing columns when safe and explicitly intended.
  - In this project, `token` may be used as the event number if that avoids a migration and matches the current product direction.

- **Do not assume production reflects local code**
  - If the user reports seeing old UI in Cloud Run, verify whether the issue is deployment-related before editing the feature again.

- **Verify with build after meaningful UI/API changes**
  - Run a local production build after multi-file changes that affect types, routing, or shared state.

## Couple Flow Rules

- **Do not reintroduce phone-first UX**
  - If editing the couple flow, prefer email OTP labels, API routes, and state names.
  - Preserve backward compatibility only where necessary.

- **Support resume flows explicitly**
  - When changing auth or event identification, make sure returning couples can still resume progress.
  - Preserve session storage behavior and resume prompt behavior.

- **Event number is a first-class UX concept**
  - Show the event number in the couple flow after event creation.
  - Prefer allowing couples to return with event number + email OTP where possible.

## Admin Flow Rules

- **Do not assume `dj_events` contains couple questionnaire fields**
  - `dj_events` and couple `events` are separate concerns unless a link is explicitly implemented.
  - If asked to show couple metadata in admin event management, first verify the underlying table actually contains that data.

- **Surface event number in admin views when available**
  - In couple/admin list views, prefer showing event number alongside event metadata.

## Deployment Rules

- **Treat Cloud Run deploy failures as a separate root-cause track**
  - If local build passes but production is stale, inspect GitHub Actions / Cloud Run before changing feature code again.

- **Be careful with Cloud Run env formatting**
  - Invalid build configuration can come from malformed build/runtime env injection.
  - Prefer simple, explicit env passing for build vars.
  - Keep runtime env handling separate and deterministic.

- **When fixing deploy workflows, change only the risky part**
  - Avoid broad workflow rewrites when the failure is isolated to env var handling or deploy flags.

## Communication Rules

- **Be direct and short**
  - Explain what is being checked or changed in one short sentence before taking action.

- **Call out uncertainty clearly**
  - If a UI label cannot be changed because the backing data does not exist in that table, say so clearly.

- **Finish with status**
  - End each work cycle with a concise status summary: changed, verified, or blocked.

## Good Defaults For Future Tasks

- **For codebase investigation**
  - Read the authoritative route/store/component before editing.

- **For auth changes**
  - Update UI copy, route usage, state naming, and resume behavior together.

- **For deploy issues**
  - Check workflow config, env injection, and build/deploy boundaries before assuming application code is broken.

