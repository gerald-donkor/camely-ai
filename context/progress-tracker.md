# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- AI generation backend foundation

## Current Goal

- None.

## Completed

- Trigger.dev foundation:
  - Added the project-level Trigger.dev config using the supported
    `@trigger.dev/sdk` root import with tasks discovered from `src/trigger`.
  - Moved the Trigger.dev project ref into local environment configuration and
    referenced it from `trigger.config.ts` through `TRIGGER_PROJECT_REF`.
  - Added a dashboard-testable `trigger-setup-check` task as the first exported
    task in the configured Trigger.dev directory.
  - Added pinned Trigger.dev CLI npm scripts for local development and deploys.
  - Kept `TRIGGER_SECRET_KEY` as a local dashboard-provided secret rather than
    committing any environment value.
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
  - Added idempotent private room creation alongside room-scoped write sessions
    carrying Clerk user metadata.
  - Reduced each auth request to one Clerk profile lookup and ran room
    provisioning concurrently with Liveblocks token authorization.
  - Added an explicit client auth callback plus uncached, structured server
    failures so Liveblocks always receives a non-empty failure reason.
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
- Presence avatars and cursors
  (`context/feature-specs/19-presence-avatars-cursor.md`):
  - Added a room-only participant group at the visible top-right canvas edge
    without changing the shared editor navbar.
  - Resolved the current Clerk session user separately through `UserButton` and
    filtered matching Liveblocks identities from collaborator avatars.
  - Added profile-photo and initials avatars, a five-person overlapping limit,
    an overflow count, and a conditional current-user divider.
  - Broadcast React Flow canvas coordinates through the official Liveblocks
    cursor integration and clear presence when the pointer leaves the canvas.
  - Rendered other participants' colored cursor pointers and name badges while
    excluding every connection belonging to the current Clerk user.
  - Aligned the shared presence contract with the required nullable `cursor`
    and boolean `thinking` fields.
  - Verified with TypeScript, ESLint, and an isolated production build.
- AI workspace sidebar shell
  (`context/feature-specs/20-ai-sidebar-shell.md`):
  - Replaced the placeholder AI panel with a polished room-only workspace
    header, close action, and animated right-side overlay.
  - Added local AI Architect and Specs tabs with clear active states and
    accessible tab semantics.
  - Added the Ghost AI Architect empty state, prompt suggestions, and a
    bottom-anchored multiline composer.
  - Updated the architect hero to `Camely AI Architect` and added a full-width
    Specs generation action with a locally versioned architecture preview card
    and disabled pre-persistence Download control.
  - Added suggestion-to-composer focus, Enter submission, Shift+Enter
    newlines, empty-submit prevention, and local submitted-prompt rendering.
  - Kept AI generation, persistence, background work, and canvas mutations out
    of this shell feature.
  - Strengthened collaborator cursor labels with guaranteed fallback names,
    explicit badge positioning, stronger contrast, and higher canvas layering.
  - Replaced viewport-pixel cursor transport with React Flow canvas-space
    coordinates that are projected through each viewer's local pan and zoom,
    keeping both users aligned to the same graph location.
  - Verified with TypeScript, ESLint, and an isolated production build.
- Canvas autosave (`context/feature-specs/21-canvas-autosave.md`):
  - Installed `@vercel/blob` and reused the existing nullable
    `canvasJsonPath` project metadata field.
  - Added authenticated owner-or-collaborator canvas GET and PUT routes with
    validated snapshot boundaries, Vercel Blob JSON storage, and Prisma URL
    persistence.
  - Added one-second debounced autosaves with serialized writes, manual save
    retries, and saving, saved, and error states.
  - Restored persisted snapshots only after confirming the Liveblocks room is
    empty, then rechecked before applying the snapshot to avoid overwriting
    active collaboration.
  - Added the editor navbar Save control with reactive status treatment and
    enabled Liveblocks unsaved-change protection.
  - Verified with TypeScript, ESLint, and an isolated production build.
- Design agent API (`context/feature-specs/22-design-agent-api.md`):
  - Added the Prisma TaskRun schema, relation, indexes, and migration for
    Trigger.dev run ownership tracking.
  - Applied the TaskRun migration to the configured PostgreSQL database.
  - Added a minimal `design-agent` Trigger.dev task under the existing
    configured `src/trigger` directory, accepting `prompt` and `roomId` and
    echoing/logging the payload without AI or canvas mutations.
  - Added `POST /api/ai/design` with authenticated JSON validation, project
    membership enforcement, Trigger.dev task triggering, TaskRun persistence,
    and `{ runId }` responses.
  - Added `POST /api/ai/design/token` with authenticated run ownership
    verification and run-scoped Trigger.dev public token issuance.
  - Added `.trigger/**` to ESLint's generated-output ignores so Trigger.dev
    temporary bundles are not linted as source.
  - Verified with Prisma validation/generation, Next.js route type generation,
    TypeScript, ESLint, and a production build.

## In Progress

- None.

## Completed This Phase

- Spec persistence and download (`context/feature-specs/28-spec-persistence-download.md`):
  - Created and applied a database migration for the new `ProjectSpec` model to track specification file metadata.
  - Generated and validated the updated Prisma client supporting the new model relationships.
  - Updated the Trigger.dev `generateSpec` background task (`src/trigger/generate-spec.ts`) to upload generated markdown content to private Vercel Blob storage, save the Postgres `ProjectSpec` record, and link it to the project.
  - Implemented the authenticated `GET /api/projects/[projectId]/specs/[specId]/download` route, validating user access via project ownership or collaborator membership before fetching the private spec from Vercel Blob.
  - Configured the download response as a structured markdown file attachment named after the normalized project title.
  - Verified with `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and a clean production `npm.cmd run build` pass.

- Spec generation flow (`context/feature-specs/27-spec-generation-flow.md`):
  - Added authenticated `POST /api/ai/spec` route with project access verification via `getProjectForIdentity`.
  - Added authenticated `POST /api/ai/spec/token` route to issue a run-scoped 1-hour public Trigger.dev token after validating ownership.
  - Created Trigger.dev `generateSpec` task in `src/trigger/generate-spec.ts` using the `@openrouter/ai-sdk-provider` and `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` model.
  - Formatted the collaborative canvas graph (nodes and edges) and chat history transcript into structured text prompts for the reasoning model.
  - Added Liveblocks presence thinking status updates and published status feed messages with explicit `source: "spec"` and `ai-status` structure for real-time tracking in the editor.
  - Verified with `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and a clean production `npm.cmd run build` pass.

- Design agent frontend (`context/feature-specs/26-design-agent-frontend.md`):
  - Wired the AI sidebar composer to push user prompts into the shared
    `ai-chat` Liveblocks feed and call `POST /api/ai/design` with
    `{ prompt, roomId }`.
  - Updated the design trigger response to return the Trigger.dev
    run-scoped `publicToken` alongside `runId`.
  - Subscribed to the active design run with `useRealtimeRun`, skipped heavy
    payload/output columns, disabled the composer while active, and rendered a
    compact status strip above the input.
  - Added collaborative assistant and system messages for completed runs,
    subscription errors, and trigger failures without manually mutating canvas
    nodes or edges.
  - Verified with `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and an elevated
    `npm.cmd run build`; the normal sandboxed build failed on the existing
    `.next/trace` `EPERM` lock.
- Sidebar chat feed (`context/feature-specs/25-sidebar-chat-feed.md`):
  - Added a room-scoped `ai-chat` Liveblocks storage feed typed separately from
    `ai-status-feed`.
  - Added a Zod-backed chat message schema and validation guard in
    `types/tasks.ts`.
  - Lifted the Liveblocks room provider to the project workspace so the canvas
    and AI sidebar share the same room context.
  - Subscribed the AI sidebar to validated `ai-chat` messages and rendered
    sender, role, timestamp, and content in feed order.
  - Rewired the existing sidebar composer to send user chat messages to
    Liveblocks storage, clear on success, and show a small local error state on
    failure without triggering backend AI tasks.
  - Verified with `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and an elevated
    `npm.cmd run build`; the initial sandboxed build hit the existing
    `.next/trace-build` `EPERM` lock.
- AI presence state (`context/feature-specs/24-ai-presence-state.md`):
  - Added the shared `ai-status-feed` Liveblocks storage feed with a generic
    task payload schema and validator in `types/tasks.ts`.
  - Updated design-agent status publishing to emit generic design-source feed
    messages with optional display text.
  - Subscribed the sidebar to the latest validated feed message only and used
    it as the shared AI working state.
  - Disabled the Architect composer and showed send-button loading while a
    generation status is active without blocking the rest of the sidebar.
  - Rendered cursor-badge thinking spinners from Liveblocks presence.
  - Verified with `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and
    `npm.cmd run build`; the build required elevated filesystem access after
    sandboxed `.next/trace` access failed with `EPERM`.
- Design agent logic (`context/feature-specs/23-design-agent-logic.md`):
  - Replace the echo Trigger.dev task with OpenRouter-backed structured design
    planning.
  - Apply AI actions through Liveblocks storage and room events.
  - Surface AI status and presence in the collaborative workspace.
  - Added the shared Liveblocks AI status message contract and updated the
    feature spec to use `@openrouter/ai-sdk-provider` instead of
    `@ai-sdk/google`.
  - Replaced the echo task with an OpenRouter-backed structured planner that
    mutates the existing Liveblocks React Flow storage, publishes shared
    statuses, and manages AI presence cleanup.
  - Wired the collaborative canvas status feed into the AI sidebar, connected
    the Architect composer to `POST /api/ai/design`, and made AI thinking
    presence visible in participant avatars and cursor labels.
  - Verified with `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and a final
    `npm.cmd run build`; the build required elevated filesystem access for the
    local `.next/trace-build` file.

## Next Up

- None for the AI presence state feature.

## Open Questions

- None.

## Architecture Decisions

- shadcn/ui uses its generated Base Nova components with Base UI primitives; generated files in `components/ui/` remain unmodified.
- The application root is permanently dark, and shadcn semantic color variables alias the Camely design tokens.
- Prisma runtime connections branch by URL protocol: Prisma Postgres/Accelerate URLs use the official Accelerate extension, while direct PostgreSQL URLs use the `pg` driver adapter.
- Direct PostgreSQL reads use a one-time retry only for closed/reset
  connection errors so stale pooled sockets do not surface as editor runtime
  overlays; non-transient errors and non-idempotent writes are not retried.
- Missing and unauthorized workspace rooms share one access-denied response so project existence is not disclosed.
- Collaborator access remains keyed by normalized email; Clerk is queried read-only for optional profile enrichment.
- Liveblocks rooms are private by default; the auth route issues short-lived write access scoped to the authorized project room.
- Canvas autosave overwrites the stable `canvas/{projectId}.json` blob and
  cache-busts authenticated server reads with the project's update timestamp;
  snapshots remain in the configured private Blob store.
- Cursor colors are deterministically derived from Clerk user IDs so identity color remains stable across sessions.
- Liveblocks authentication resolves the Clerk profile once, runs room
  provisioning and token issuance concurrently, never caches token responses,
  and normalizes infrastructure failures into reason-bearing JSON.
- Design-generation Trigger.dev run subscription tokens are minted only after
  verifying a persisted TaskRun record belongs to the signed-in Clerk user.

## Session Notes

- AI-generated node color remediation completed on 2026-07-07 by making the
  design-agent color sanitizer accept palette names case-insensitively and
  infer palette colors from generated node labels and shapes when the model
  omits `colorName`. Future generated architecture diagrams now map APIs and
  services to Blue, auth to Purple, databases/caches to Teal, queues/events to
  Orange, and human actors to Pink. `npx.cmd tsc --noEmit`,
  `npm.cmd run lint`, and an elevated `npm.cmd run build` pass; the normal
  sandboxed build failed on `.next/trace-build` with `EPERM`.
- Maximum update depth remediation completed on 2026-07-07 by returning a
  stable latest AI status message from the Liveblocks storage selector instead
  of a fresh array, and by making the save-feedback navbar effect depend on
  save capability rather than the inline `onSave` callback identity.
  `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and an elevated
  `npm.cmd run build` pass; the normal sandboxed build failed on `.next/trace`
  with `EPERM`.
- Design agent frontend implementation completed on 2026-07-07 with
  Liveblocks-backed prompt/error/final messages, `useRealtimeRun` status
  tracking from the returned Trigger.dev public token, active-run composer
  disabling, and a compact status strip. `npx.cmd tsc --noEmit`,
  `npm.cmd run lint`, and an elevated `npm.cmd run build` pass; the normal
  sandboxed build failed on `.next/trace` with `EPERM`.
- Sidebar chat feed implementation completed on 2026-07-07 with a separate
  room-scoped `ai-chat` Liveblocks storage list, Zod-validated chat messages,
  shared workspace-level Liveblocks room context, and sidebar composer sending
  that does not call backend AI tasks. `npx.cmd tsc --noEmit`,
  `npm.cmd run lint`, and an elevated `npm.cmd run build` pass; the normal
  sandboxed build failed on `.next/trace-build` with `EPERM`.
- AI presence state implementation completed on 2026-07-07 with a generic
  `ai-status-feed` storage feed, validated `types/tasks.ts` payloads, latest
  status rendering, shared composer loading state, and cursor-badge thinking
  spinners. `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and an elevated
  `npm.cmd run build` pass; the normal sandboxed build failed on `.next/trace`
  with `EPERM`.
- Design agent API implementation started on 2026-07-07.
- Design agent API implementation completed on 2026-07-07. `npx.cmd prisma
  validate`, `npx.cmd prisma generate`, `npx.cmd next typegen`, `npx.cmd tsc
  --noEmit`, `npm.cmd run lint`, and `npm.cmd run build` pass; the normal build
  required elevated filesystem access because the local `.next` trace file was
  locked under sandboxed permissions.
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
- Presence avatar and cursor implementation completed on 2026-07-06. `npx tsc
  --noEmit`, `npm run lint`, and an isolated `npm run build` pass; the normal
  build directory remained locked by the active development environment.
- AI workspace shell and collaborator cursor-label remediation completed on
  2026-07-06. `npx tsc --noEmit`, `npm run lint`, and an isolated `npm run
  build` pass; the normal build directory remained locked by the active
  development environment.
- Collaborator cursor presence during React Flow node and selection dragging
  was remediated on 2026-07-06 so remote names remain visible while shapes
  move. `npx tsc --noEmit`, `npm run lint`, and an isolated `npm run build`
  pass; the normal build directory remained locked by the active development
  environment.
- Cross-viewport cursor alignment was remediated on 2026-07-06 by adopting the
  official Liveblocks React Flow cursor integration and storing presence in
  shared flow coordinates rather than per-window pixels. `npx tsc --noEmit`,
  `npm run lint`, and an isolated `npm run build` pass.
- Liveblocks authentication timeout and empty-500 responses were remediated on
  2026-07-06 by removing the duplicate Clerk lookup, parallelizing Liveblocks
  room provisioning and token issuance, and adding structured client/server
  auth errors. `npx tsc --noEmit`, `npm run lint`, and an isolated `npm run
  build` pass.
- AI workspace branding and the Specs shell were refined on 2026-07-06 with
  the `Camely AI Architect` hero, full-width Generate Spec action, locally
  versioned architecture card, and guarded Download control. `npx tsc
  --noEmit`, `npm run lint`, and an isolated `npm run build` pass.
- Canvas autosave and empty-room snapshot restoration completed on 2026-07-06.
  `npx tsc --noEmit`, `npm run lint`, and an isolated `npm run build` pass; the
  normal build directory remained locked by the active development
  environment.
- Canvas Blob access was corrected on 2026-07-06 to use the configured private
  store for both authenticated writes and server-side reads after the public
  access mismatch surfaced as a save-time `502`.
- Prisma direct PostgreSQL client construction was hardened on 2026-07-06 by
  scoping the `pg` adapter to the cached Prisma client instance and adding a
  one-time closed-connection retry around editor/project authorization reads.
  `npx tsc --noEmit` and `npm run lint` pass.
- Current issue 1 was remediated on 2026-07-06 by making the workspace Save
  button default to `Save`, show transient `Saving...`, `Saved`, and `Error`
  states from the autosave status, and remain hidden from the editor home
  navbar. The canvas save route already used private Blob access and SDK reads.
- Manual workspace saves were tightened on 2026-07-06 so the Save button
  forces the existing autosave persistence path to write the current canvas
  snapshot even when it matches the last autosaved payload.
- Current issues 2 through 7 were remediated on 2026-07-06:
  - Added wrapper-scoped Delete/Backspace removal for selected React Flow nodes
    and edges using `useNodes()`, `useEdges()`, and the existing
    Liveblocks-backed change handlers, then hardened it with document-level
    capture scoped back to the canvas so selection deletion still fires when
    React Flow holds focus.
  - Added source and target handles on all four custom node sides so top,
    right, bottom, and left handles can participate in connections.
  - Removed React Flow's initial `fitView` behavior from the live canvas so
    dropping the first node no longer changes the user's viewport.
  - Kept dropped nodes centered at the cursor position and aligned the drag
    preview offset with the same center point.
  - Allowed `img.clerk.com` through Next image `remotePatterns`.
  - Hid the Clerk `UserButton` in the project workspace navbar while preserving
    it in the editor home navbar.
- Issue 2 delete-key remediation was corrected on 2026-07-07 by capturing
  Delete/Backspace at the document level, scoping the event back to the active
  canvas wrapper, preserving editable-field guards, and keeping deletion on the
  existing Liveblocks-backed node and edge change handlers. `npx.cmd tsc
  --noEmit` and `npm.cmd run lint` pass.
- Issue 2 deletion was corrected again on 2026-07-07 after confirming
  `@liveblocks/react-flow` intentionally ignores `remove` changes passed to
  `onNodesChange` and `onEdgesChange`; the custom Delete/Backspace handler now
  reads selected nodes and edges from React Flow and calls the Liveblocks
  `onDelete` mutation helper so removals sync through collaborative storage.
  `npx.cmd tsc --noEmit` and `npm.cmd run lint` pass.
- Canvas area selection was added on 2026-07-07 by enabling React Flow's pane
  drag-selection with partial-overlap selection, keeping selection local through
  the Liveblocks React Flow adapter, preserving Space+drag and middle/right
  mouse panning, and disabling double-click zoom so canvas double-click/drag
  gestures do not unexpectedly zoom the workspace. `npx.cmd tsc --noEmit` and
  `npm.cmd run lint` pass.
- Canvas panning after area selection was corrected on 2026-07-07 by restoring
  normal left-drag panning as the default and making area selection a one-shot
  mode armed by double-clicking the empty canvas; the mode disarms after the
  selection completes or after a follow-up pane click. `npx.cmd tsc --noEmit`
  and `npm.cmd run lint` pass.
- Trigger.dev foundation was completed on 2026-07-07 with a v4 root SDK config
  import, an env-backed `TRIGGER_PROJECT_REF`, a first `trigger-setup-check`
  task, and pinned local CLI scripts. `npx.cmd tsc --noEmit` and `npm.cmd run
  lint` pass; `npm.cmd run build` was blocked by an existing `.next/trace`
  `EPERM` permission/lock error.
- Design agent logic implementation continued on 2026-07-07 with the
  OpenRouter provider correction applied to the feature spec and shared
  Liveblocks AI status typing added for task/UI integration.
- Design agent backend logic was implemented on 2026-07-07 with structured
  OpenRouter planning, action sanitization, server-side `mutateFlow` updates,
  room status publication, and AI presence lifecycle handling.
- Design agent UI wiring was implemented on 2026-07-07 with Liveblocks storage
  status feed sync, API-backed Architect prompt submission, shared progress
  rendering, and visible AI thinking presence treatment.
- Design agent logic verification completed on 2026-07-07. `npx.cmd tsc
  --noEmit`, `npm.cmd run lint`, and an elevated `npm.cmd run build` pass.
- Design agent OpenRouter/Nemotron schema compatibility was corrected on
  2026-07-07 by simplifying the structured-output JSON schema and disabling
  strict provider schema constraints while keeping shape, color, action, and
  layout enforcement in the task-side sanitizer.
- Design agent planning was converted on 2026-07-07 from AI SDK
  `Output.object()` structured output to action-specific AI SDK tool calls
  (`addNode`, `moveNode`, `resizeNode`, `updateNodeData`, `deleteNode`,
  `addEdge`, `deleteEdge`) to avoid provider runs with no generated object
  while preserving the existing Liveblocks mutation sanitizer.
- Design agent configuration was updated on 2026-07-12 to target the new NVIDIA:
  Nemotron 3 Nano Omni (free) model (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`).
  Corrected AI SDK `generateText` parameters by changing the invalid `instructions`
  to `system`, passing `maxOutputTokens` directly to limit generation cleanly,
  and disabling `parallelToolCalls` for maximum model compatibility. Both
  TypeScript and lint checks pass successfully.
