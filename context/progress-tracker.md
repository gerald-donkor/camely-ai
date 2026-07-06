# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Collaborative canvas foundation

## Current Goal

- Starter templates can replace the active collaborative canvas; ready for the
  next collaborative canvas feature.

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
- Liveblocks setup (`context/feature-specs/10-liveblocks-setup.md`):
  - Added globally typed cursor and thinking presence plus user name, avatar, and cursor color metadata.
  - Added a lazily initialized, development-cached Liveblocks server client.
  - Added deterministic cursor color assignment from a fixed canvas-aligned palette.
  - Added a Clerk-authenticated room token route with existing owner-or-collaborator project access enforcement.
  - Added idempotent private room creation and room-scoped write sessions carrying Clerk user metadata.
  - Recorded the Liveblocks client, React, React Flow, and Node packages as reproducible dependencies.
  - Verified with Next.js route type generation, TypeScript, ESLint, and a production build.
- Base collaborative canvas (`context/feature-specs/11-base-canvas.md`):
  - Kept the workspace route server-rendered and added a focused client boundary for Liveblocks and React Flow.
  - Added room-scoped Liveblocks providers with initial presence, suspense loading, and a connection error fallback.
  - Added shared canvas node data, shape, node, and edge types.
  - Wired empty Liveblocks-synced nodes and edges into React Flow with loose connections, fit-to-view, a minimap, and a dot background.
  - Kept controls, custom rendering, persistence, cursors, and AI behavior out of scope.
  - Verified with TypeScript, ESLint, and a production build.
- Shape panel (`context/feature-specs/12-shape-panel.md`):
  - Added a floating bottom-center toolbar with draggable rectangle, diamond, circle, pill, cylinder, and hexagon controls.
  - Added typed drag payloads containing each shape and its sensible default width and height.
  - Added validated canvas drop handling with screen-to-canvas coordinate conversion.
  - Added shared Liveblocks-backed canvas nodes with empty labels, the default node color, custom node type, dragged shape data, and shape-timestamp-counter IDs.
  - Added the intentionally basic centered-label rectangular renderer for all custom canvas nodes.
  - Verified with TypeScript, ESLint, and a production build.
- Canvas issue remediation (`context/current-issues.md`):
  - Replaced the padded three-column card layout with an edge-to-edge infinite
    canvas and overlay project/AI sidebars.
  - Corrected the hidden project-sidebar transform so it clears the viewport
    completely.
  - Hardened the drag payload with a browser-compatible fallback and centered
    dropped nodes after React Flow pan/zoom coordinate projection.
  - Added distinct SVG geometry for every supported canvas node shape.
  - Made the dotted canvas background explicit and token-based.
  - Verified with TypeScript, ESLint, and a production build.
- Node shape rendering and drag preview (`context/feature-specs/13-node-shape.md`):
  - Added shared shape visuals used by both collaborative nodes and drag previews.
  - Rendered rectangle, pill, and circle with CSS and diamond, hexagon, and cylinder with scalable SVG geometry.
  - Added subtle resting borders with brighter selected-node borders.
  - Added shape-sized native drag previews centered on the cursor and automatically cleared when dragging ends.
  - Kept existing Liveblocks node state, drop payloads, dimensions, and creation behavior unchanged.
  - Verified with ESLint, TypeScript, and a production build.
- Canvas node connection-handle remediation:
  - Added React Flow handles to the top, right, bottom, and left of every custom node.
  - Kept handles subtle at rest, revealed them on hover, and kept them visible while selected.
  - Used the existing loose connection mode and Liveblocks `onConnect` flow so created edges remain collaborative.
  - Corrected handle stacking above the full-node label layer and enlarged the invisible pointer target so React Flow can reliably resolve connection endpoints.
  - Verified with ESLint, TypeScript, and a production build.
- Node editing (`context/feature-specs/14-node-editing.md`):
  - Added subtle resize controls to selected nodes with enforced minimum width
    and height.
  - Enlarged the invisible pointer targets around resize handles and edges while
    retaining their subtle visual size.
  - Kept resizing on React Flow's existing Liveblocks-backed node change flow.
  - Added centered inline label editing on double-click with a stable empty-label
    placeholder and an overlaid textarea.
  - Synced label changes as users type through the existing collaborative node
    state flow.
  - Closed editing on blur or Escape and isolated textarea pointer, wheel, and
    keyboard interactions from canvas dragging and panning.
  - Verified with ESLint, TypeScript, and a production build.
- Node color toolbar (`context/feature-specs/15-nodes-color-toolbar.md`):
  - Added the eight documented background and matching text-color pairs as
    typed canvas constants.
  - Added a compact floating toolbar above selected nodes with one accessible
    swatch per color pair.
  - Added clear active-swatch treatment and tight text-color-based hover glows.
  - Prevented toolbar interactions from dragging nodes or panning the canvas.
  - Synced background and text-color changes together through the existing
    Liveblocks-backed node change flow without server calls.
  - Kept existing collaborative nodes backward-compatible by deriving missing
    text colors from their stored background color.
  - Verified with ESLint, TypeScript, and a production build.
- Edge behavior (`context/feature-specs/16-edge-behavior.md`):
  - Kept four-way loose connection handles on every node with subtle
    hover-and-selection visibility.
  - Added custom smooth-step edge rendering with rounded light strokes,
    arrowheads, dimmed resting treatment, and brighter hover and selection
    states.
  - Enlarged the invisible edge interaction width without increasing the
    visible stroke thickness.
  - Added midpoint labels through `EdgeLabelRenderer` and the coordinates
    returned by `getSmoothStepPath`.
  - Added growing inline label inputs opened by edge double-click, with saves
    on blur, Enter, or Escape and pill badges for saved labels.
  - Synced new custom edges and label updates through the existing
    Liveblocks-backed edge change flow.
  - Verified with ESLint, TypeScript, and a production build.
- Canvas ergonomics (`context/feature-specs/17-canvas-ergonomics.md`):
  - Added a floating bottom-left control bar with animated zoom out, fit view,
    and zoom in actions driven by the React Flow instance.
  - Added Liveblocks-backed undo and redo controls with reactive disabled
    states and dimmed disabled styling.
  - Added window-level zoom and history keyboard shortcuts in
    `hooks/useKeyboardShortcuts.ts`, with editable-field guards.
  - Removed the React Flow minimap without changing the shape panel, nodes,
    edges, or collaborative state setup.
  - Verified with TypeScript, ESLint, and an isolated production build.
- Starter templates (`context/feature-specs/18-starter-template.md`):
  - Added typed microservices, CI/CD pipeline, and event-driven system
    templates using the shared canvas node, edge, shape, and color contracts.
  - Added a scrollable template dialog with descriptive cards and lightweight
    SVG previews fitted from each template's calculated node bounds.
  - Added a workspace navbar entry point and one-click import actions that
    close the dialog after selection.
  - Replaced existing collaborative nodes and edges through the established
    Liveblocks React Flow change handlers before adding the selected template.
  - Fit the canvas viewport after the imported graph reaches collaborative
    state without adding server persistence or changing node/edge renderers.
  - Verified with TypeScript, ESLint, and an isolated production build.

## In Progress

- None.

## Next Up

- Define the next collaborative canvas feature.

## Open Questions

- None.

## Architecture Decisions

- shadcn/ui uses its generated Base Nova components with Base UI primitives; generated files in `components/ui/` remain unmodified.
- The application root is permanently dark, and shadcn semantic color variables alias the Camely design tokens.
- Prisma runtime connections branch by URL protocol: Prisma Postgres/Accelerate URLs use the official Accelerate extension, while direct PostgreSQL URLs use the `pg` driver adapter.
- Missing and unauthorized workspace rooms share one access-denied response so project existence is not disclosed.
- Collaborator access remains keyed by normalized email; Clerk is queried read-only for optional profile enrichment.
- Liveblocks rooms are private by default; the auth route issues short-lived write access scoped to the authorized project room.
- Cursor colors are deterministically derived from Clerk user IDs so identity color remains stable across sessions.

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
- Liveblocks collaboration infrastructure implementation started on 2026-07-02.
- Liveblocks collaboration infrastructure implementation completed on 2026-07-02. `npx next typegen`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Base collaborative canvas implementation started on 2026-07-02.
- Base collaborative canvas implementation completed on 2026-07-02. `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Refined the React Flow minimap on 2026-07-02 with dark theme tokens plus enabled panning and zooming.
- Corrected the minimap SVG background on 2026-07-02 through React Flow's `bgColor` API so empty rooms no longer expose its white default.
- Refined the workspace navbar actions on 2026-07-02 into a consistent bordered action group with aligned Share, AI, and Clerk profile controls.
- Enhanced the workspace AI toggle on 2026-07-02 with token-based indigo-to-cyan transitions, glow, lift, and sparkle hover motion.
- Shape panel implementation started on 2026-07-02.
- Shape panel implementation completed on 2026-07-02. `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Canvas visual, sidebar overlay, drag-and-drop, and shape-rendering issues were
  resolved on 2026-07-02. `npx tsc --noEmit`, `npm run lint`, and
  `npm run build` pass.
- Node shape rendering and drag preview implementation started on 2026-07-05.
- Node shape rendering and drag preview implementation completed on 2026-07-05.
  `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- Canvas node connection-handle remediation started on 2026-07-05.
- Canvas node connection-handle remediation completed on 2026-07-05.
  `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- Canvas connection handle hit-testing remediation started on 2026-07-05.
- Canvas connection handle hit-testing remediation completed on 2026-07-05.
  `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- Node editing implementation started on 2026-07-05.
- Node editing implementation completed on 2026-07-05. `npm run lint`,
  `npx tsc --noEmit`, and `npm run build` pass.
- Node resize hit-target remediation completed on 2026-07-05 with larger
  invisible corner and edge grab areas.
- Node color toolbar implementation started on 2026-07-05.
- Node color toolbar implementation completed on 2026-07-05. `npm run lint`,
  `npx tsc --noEmit`, and `npm run build` pass.
- Node color toolbar pointer handling was remediated on 2026-07-06 by binding
  each toolbar to its node explicitly and applying mouse/touch swatch changes
  on primary pointer down before React Flow can consume the gesture.
- Edge behavior implementation completed on 2026-07-06. `npm run lint`,
  `npx tsc --noEmit`, and an isolated `npm run build` pass; the isolated build
  directory avoided the active development server's `.next` lock.
- Canvas ergonomics implementation started on 2026-07-06.
- Canvas ergonomics implementation completed on 2026-07-06. `npx tsc
  --noEmit`, `npm run lint`, and an isolated `npm run build` pass; the normal
  build directory remained locked by the active development environment.
- Narrowed the workspace AI assistant panel to a 19.5rem desktop width on
  2026-07-06 while preserving its viewport-aware mobile cap.
- Starter template implementation started on 2026-07-06.
- Starter template implementation completed on 2026-07-06. `npx tsc
  --noEmit`, `npm run lint`, and an isolated `npm run build` pass; the normal
  build directory remained locked by the active development environment.
- Starter template dialog visual refinement started on 2026-07-06 to align its
  sizing, three-card layout, preview treatment, and import actions with the
  approved reference.
- Starter template dialog visual refinement completed on 2026-07-06 with a
  centered 57rem modal, compact three-card layout, simplified dark diagram
  previews, replacement/undo guidance, and full-width outline import actions.
  `npx tsc --noEmit` and `npm run lint` pass.
- Added a serverless web application starter template on 2026-07-06 covering
  CDN delivery, managed API functions, storage, task queues, background work,
  and notifications. `npx tsc --noEmit` and `npm run lint` pass.
- Refined the starter template dialog on 2026-07-06 so all template cards stay
  in one horizontal row, with a wider desktop modal and horizontal overflow on
  smaller viewports. `npx tsc --noEmit` and `npm run lint` pass.
