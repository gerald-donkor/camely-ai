# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor workspace foundation

## Current Goal

- Project sharing is complete; ready for canvas infrastructure.

## Completed

- Design system foundation (`context/feature-specs/01-design-system.md`):
  - Configured shadcn/ui for Next.js and Tailwind CSS v4.
  - Added Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea primitives.
  - Added Lucide React and the shared `cn()` class-merging helper.
  - Mapped the Camely dark-theme tokens into Tailwind and shadcn semantic tokens.
  - Verified with ESLint, a production build, component import checks, and a direct `cn()` merge check.
- Editor chrome (`context/feature-specs/02-editor.md`):
  - Added a fixed-height, three-section editor navbar with an accessible, state-aware project-sidebar toggle.
  - Added a floating overlay project sidebar with slide-in behavior, close control, My Projects and Shared tabs, empty states, and a full-width New Project action.
  - Confirmed the existing protected dialog primitives compose token-based title, description, and footer actions without modification.
  - Verified with ESLint, TypeScript, and a production build.
- Authentication (`context/feature-specs/03-auth.md`):
  - Added `@clerk/ui` and wrapped the root layout with Clerk's dark theme customized through existing application CSS variables.
  - Added minimal responsive sign-in and sign-up pages using Clerk's prebuilt components.
  - Added root-level `proxy.ts` with public auth paths sourced from Clerk's route environment variables and protection for every other route.
  - Added session-aware redirects from `/` to `/editor` or `/sign-in`.
  - Added Clerk's default `UserButton` to the editor navbar.
  - Added the protected `/editor` destination with the reusable navbar and floating project sidebar composed around the canvas surface.
  - Verified with ESLint, TypeScript, and a production build.
- Project dialogs (`context/feature-specs/04-project-dialogs.md`):
  - Added the minimal editor home with a centered create-project action.
  - Added mock owned and shared projects, with rename and delete actions restricted to owned projects.
  - Added create, rename, and destructive delete dialogs with keyboard submission and rename auto-focus.
  - Added live project slug generation to the create dialog.
  - Added a dedicated hook for dialog, form, loading, and mock project state.
  - Wired both create actions and the sidebar rename/delete actions to local mock updates.
  - Added a mobile backdrop that closes the floating sidebar when tapped.
  - Verified with ESLint, TypeScript, and a production build.
- Project APIs (`context/feature-specs/06-projects-apis.md`):
  - Added authenticated project list and create handlers using the Clerk user ID as `ownerId`.
  - Added owner-only rename and delete handlers with explicit `401`, `403`, and `404` responses.
  - Added validated JSON request parsing and the `Untitled Project` create fallback.
  - Restored the Prisma source schema, Prisma 7 PostgreSQL adapter client, and reproducible package dependencies represented by the generated client.
  - Kept the feature backend-only; the existing mock project UI remains unchanged.
  - Verified with Prisma validation and generation, Next.js route type generation, TypeScript, ESLint, and a production build.
- Editor home API wiring (`context/feature-specs/07-wire-editor-home.md`):
  - Converted `/editor` to a server-rendered project data boundary using Clerk identity and direct Prisma queries.
  - Added separate owned and email-collaborated project lists and passed both into the client sidebar.
  - Replaced mock project state with `useProjectActions` for create, rename, delete, dialog, loading, and error state.
  - Added stable slug-plus-random-suffix room ID previews and persisted that room ID as the project ID.
  - Added `/editor/[projectId]` workspace navigation and membership validation.
  - Added sidebar project links, rename refreshes, and active-workspace delete redirects.
  - Verified with Next.js route type generation, TypeScript, ESLint, and a production build.
- Prisma project foundation (`context/feature-specs/05-prisma.md`):
  - Added `Project` and `ProjectCollaborator` to the multi-file Prisma schema with the required status enum, relation, cascade delete, unique constraint, and indexes.
  - Added an environment-aware cached Prisma singleton that uses Accelerate for `prisma+postgres://` and `@prisma/adapter-pg` for direct PostgreSQL URLs.
  - Configured Prisma CLI environment loading from `.env.local` with `.env` fallback.
  - Created and applied the initial `init_projects` migration.
  - Generated and validated the Prisma 7.8 client.
  - Verified migration status, ESLint, TypeScript, and a production build.
- Editor workspace shell (`context/feature-specs/08-editor-workspace-shell.md`):
  - Renamed the dynamic workspace route to `/editor/[roomId]` and retained it as a Server Component.
  - Added shared Clerk identity and owner-or-collaborator project access helpers.
  - Added a common `AccessDenied` state for missing and unauthorized projects.
  - Added a dedicated full-viewport project workspace with the project name, disabled share placeholder, AI sidebar toggle, canvas placeholder, and AI chat placeholder.
  - Reused the project sidebar with current-room highlighting and automatic owned/shared tab selection.
  - Kept Liveblocks, real canvas behavior, AI chat, and sharing behavior out of scope.
  - Verified with Next.js route type generation, TypeScript, ESLint, and a production build.
- Share dialog (`context/feature-specs/09-share-dialog.md`):
  - Added authenticated collaborator list, invite, and remove API operations.
  - Enforced owner-only invite and removal server-side while allowing collaborators to list access.
  - Added Clerk Backend API enrichment for collaborator display names and avatars with email-only fallback.
  - Added a workspace share dialog with owner management controls and collaborator read-only rendering.
  - Added owner-only project-link copying with temporary `Copied!` feedback.
  - Kept collaborator identity email-based in PostgreSQL without adding a local user table.
  - Verified with Next.js route type generation, TypeScript, ESLint, and a production build.

## In Progress

- None.

## Next Up

- Add canvas infrastructure in its dedicated feature unit.

## Open Questions

- None.

## Architecture Decisions

- shadcn/ui uses its generated Base Nova components with Base UI primitives; generated files in `components/ui/` remain unmodified.
- The application root is permanently dark, and shadcn semantic color variables alias the Camely design tokens.
- Prisma runtime connections branch by URL protocol: Prisma Postgres/Accelerate URLs use the official Accelerate extension, while direct PostgreSQL URLs use the `pg` driver adapter.
- Missing and unauthorized workspace rooms share one access-denied response so project existence is not disclosed.
- Collaborator access remains keyed by normalized email; Clerk is queried read-only for optional profile enrichment.

## Session Notes

- Design system implementation completed on 2026-06-29. `npm run lint` and `npm run build` pass.
- Editor chrome implementation started on 2026-06-29.
- Editor chrome implementation completed on 2026-06-29. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- Authentication implementation started on 2026-06-29.
- Authentication implementation completed on 2026-06-29. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- Auth pages refined on 2026-06-29 to match the approved two-panel visual reference with Camely AI wording.
- Clerk's sign-in and sign-up cross-links were explicitly connected to the dedicated public auth routes on 2026-06-29.
- The protected editor route was added on 2026-06-29 with the project sidebar open by default.
- The logout RSC navigation failure was resolved on 2026-06-29 by configuring direct Clerk provider redirects between public auth routes and `/editor`.
- Grammarly-injected root body attributes were isolated on 2026-06-29 with body-scoped hydration warning suppression.
- Project dialogs implementation started on 2026-06-29.
- Project dialogs implementation completed on 2026-06-29. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- The create dialog was refined on 2026-06-29 to match the approved compact reference; slug generation remains internal to the mock project state.
- The create dialog now reveals a live normalized slug beneath the input once a project name is entered, with explicit primary and placeholder text colors.
- Project API implementation started on 2026-07-01.
- Project API implementation completed on 2026-07-01. `npx prisma validate`, `npx prisma generate`, `npx next typegen`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Project API route, helper, and Prisma sections were annotated on 2026-07-01 for easier code navigation.
- Editor home API wiring started on 2026-07-01.
- Editor home API wiring completed on 2026-07-01. `npx next typegen`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Prisma project foundation implementation started on 2026-06-29.
- Prisma project foundation implementation completed on 2026-06-29. The initial migration is applied, migration status is current, and `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- Editor workspace shell implementation started on 2026-07-02.
- Editor workspace shell implementation completed on 2026-07-02. `npx next typegen`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Removed the leftover empty `/editor/[projectId]` source directory on 2026-07-02 after its stale development route conflicted with `/editor/[roomId]`.
- Refined the project-detail workspace on 2026-07-02 to use the approved docked three-panel shell, project-context navbar, bordered canvas placeholder, and expanded AI placeholder.
- Share dialog implementation started on 2026-07-02.
- Share dialog implementation completed on 2026-07-02. `npx next typegen`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Share access lists were refined on 2026-07-02 to always include the current project owner as a non-removable, Clerk-enriched owner row.
