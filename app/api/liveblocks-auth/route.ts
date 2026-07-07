import {
  getCursorColor,
  getLiveblocksClient,
} from "@/lib/liveblocks"
import {
  getCurrentClerkIdentity,
  getProjectForIdentity,
} from "@/lib/project-access"
import { readJsonObject } from "@/lib/project-api"

function authenticationErrorResponse(reason: string, status: number) {
  return Response.json(
    {
      error: "authentication_error",
      reason,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status,
    },
  )
}

function readRoomId(body: Record<string, unknown>) {
  return typeof body.room === "string" && body.room.trim()
    ? body.room.trim()
    : null
}

// POST /api/liveblocks-auth — Authorize a project member for one canvas room.
async function authorizeRoom(request: Request) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return authenticationErrorResponse("Unauthorized", 401)
  }

  const body = await readJsonObject(request)

  if (!body) {
    return authenticationErrorResponse(
      "Request body must be a JSON object",
      400,
    )
  }

  const roomId = readRoomId(body)

  if (!roomId) {
    return authenticationErrorResponse("A room ID is required", 400)
  }

  const project = await getProjectForIdentity(roomId, identity)

  if (!project) {
    return authenticationErrorResponse("Forbidden", 403)
  }

  const color = getCursorColor(identity.userId)
  const liveblocks = getLiveblocksClient()

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name: identity.displayName,
      avatar: identity.avatarUrl,
      color,
    },
  })

  session.allow(roomId, ["*:write"])

  const [authorization] = await Promise.all([
    session.authorize(),
    liveblocks.getOrCreateRoom(roomId, {
      defaultAccesses: [],
    }),
  ])
  const { body: token, error, status } = authorization

  if (error || status < 200 || status >= 300 || !token.trim()) {
    console.error(
      "Liveblocks token service rejected authorization",
      error ?? new Error(`Unexpected status ${status}`),
    )

    return authenticationErrorResponse(
      "The collaboration token service is temporarily unavailable",
      503,
    )
  }

  return new Response(token, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
    status,
  })
}

export async function POST(request: Request) {
  try {
    return await authorizeRoom(request)
  } catch (error) {
    console.error("Liveblocks room authorization failed", error)

    return authenticationErrorResponse(
      "The collaboration service could not authenticate this request",
      503,
    )
  }
}
