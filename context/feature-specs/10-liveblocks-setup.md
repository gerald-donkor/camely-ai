Set up the realtime collaboration infrastructure using Liveblocks.

## Configuration

Configure the `liveblocks.config.ts` at the project root.

Define:

### Presence

- cursor position
- `isThinking` boolean

### UserMeta

- user ID
- display name
- avatar URL
- cursor color

## Liveblocks Client

Create a cached Liveblocks node client in `lib`.

Add a helper that deterministically maps a user ID to a consistent color from a fixed palette.

## Auth Route

Create `POST /api/liveblocks-auth`.

Use the project ID as the Liveblocks room ID.

This route must:

1. require Clerk authentication
2. verify project access using the existing access helper
3. ensure the Liveblocks room exists concurrently with token
   authorization so room provisioning does not add another
   sequential network wait
4. return a session token with:
   - user name
   - avatar
   - generated cursor color

Return `403` for unauthorized project access.

The auth endpoint must:

- resolve the Clerk user profile only once per request
- return uncached responses
- normalize infrastructure failures into a JSON response with a
  non-empty `reason`
- use a client auth callback that preserves the server-provided
  failure reason

## Dependencies

All required Liveblocks packages are already installed.

## Check When Done

- `liveblocks.config.ts` defines Presence and UserMeta
- Liveblocks client is cached
- auth route verifies project access
- user metadata is attached to sessions
- `npm run build` passes
