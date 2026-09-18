---
type: "Route Map"
title: "Frontend route map"
description: "Generated inventory of App Router pages and the feature barrels they compose."
tags: [architecture, routes, map]
status: stable
sources:
  - id: "app-router"
    resource: "src/app"
    title: "Next.js App Router pages"
---

# Frontend route map

The current App Router exposes **29 pages**. Routes under `src/app/` are a routing table. Feature code lives in `src/features/`.

| Route | Page module | Feature composition |
|---|---|---|
| `/` | `src/app/page.tsx` | `@/features/public-site` |
| `/admin` | `src/app/(platform)/admin/page.tsx` | `@/features/admin/users` |
| `/admin/feedback` | `src/app/(platform)/admin/feedback/page.tsx` | `@/features/admin/feedback` |
| `/admin/users/[id]` | `src/app/(platform)/admin/users/[id]/page.tsx` | `@/features/admin/user-detail` |
| `/auth/callback` | `src/app/(access)/auth/callback/page.tsx` | `@/features/auth/callback` |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` | `@/features/auth/edu-password-recovery` |
| `/connect-github` | `src/app/connect-github/page.tsx` | `@/features/auth/edu-connect-github` |
| `/groups/[groupId]` | `src/app/(platform)/groups/[groupId]/page.tsx` | `@/features/groups/detail` |
| `/groups/[groupId]/activity` | `src/app/(platform)/groups/[groupId]/activity/page.tsx` | `@/features/groups/activity` |
| `/groups/[groupId]/delivery-projects/[deliveryProjectId]` | `src/app/(platform)/groups/[groupId]/delivery-projects/[deliveryProjectId]/page.tsx` | `@/features/groups/delivery-project` |
| `/groups/[groupId]/members` | `src/app/(platform)/groups/[groupId]/members/page.tsx` | `@/features/groups/members` |
| `/groups/[groupId]/repositories/[repositoryId]` | `src/app/(platform)/groups/[groupId]/repositories/[repositoryId]/page.tsx` | `@/features/groups/repository` |
| `/groups/[groupId]/systems` | `src/app/(platform)/groups/[groupId]/systems/page.tsx` | `@/features/groups/systems` |
| `/groups/[groupId]/systems/[systemId]` | `src/app/(platform)/groups/[groupId]/systems/[systemId]/page.tsx` | `@/features/groups/system-detail` |
| `/guide` | `src/app/(public)/guide/page.tsx` | `@/features/guide/overview` |
| `/home` | `src/app/(platform)/home/page.tsx` | `@/features/home/dashboard` |
| `/inbox` | `src/app/(platform)/inbox/page.tsx` | `@/features/notifications/inbox` |
| `/login` | `src/app/(access)/login/page.tsx` | `@/features/auth/login` |
| `/projects/[projectId]` | `src/app/(platform)/projects/[projectId]/page.tsx` | `@/features/projects/detail` |
| `/runs` | `src/app/(platform)/runs/page.tsx` | `@/features/runs/list` |
| `/settings` | `src/app/(platform)/settings/page.tsx` | `@/features/settings/account` |
| `/signin` | `src/app/signin/page.tsx` | `@/features/auth/edu-signin` |
| `/signin/create-account` | `src/app/signin/create-account/page.tsx` | `@/features/auth/edu-signup` |
| `/signin/forgot-password` | `src/app/signin/forgot-password/page.tsx` | `@/features/auth/edu-password-recovery` |
| `/signin/staff` | `src/app/signin/staff/page.tsx` | `@/features/auth/edu-signin` |
| `/signin/student` | `src/app/signin/student/page.tsx` | `@/features/auth/edu-signin` |
| `/signup` | `src/app/(access)/signup/page.tsx` | `@/features/auth/self-serve` |
| `/teams` | `src/app/(platform)/teams/page.tsx` | `@/features/teams/detail` |
| `/workflows` | `src/app/(platform)/workflows/page.tsx` | `@/features/workflows/studio` |

`/`, `/login`, `/signup`, and `/auth/callback` may contain small inline composition. Other pages re-export a feature view.

## Verification

Run `npm run arch:check` and `npm run generate:architecture-maps -- --check`.
