import { currentUser } from "@clerk/nextjs/server"

import {
  getCursorColor,
  getLiveblocksClient,
} from "@/lib/liveblocks"
import {
  getCurrentClerkIdentity,
  getProjectForIdentity,
} from "@/lib/project-access"
import { errorResponse, readJsonObject } from "@/lib/project-api"

function readRoomId(body: Record<string, unknown>) {
  return typeof body.room === "string" && body.room.trim()
    ? body.room.trim()
    : null
}

// POST /api/liveblocks-auth — Authorize a project member for one canvas room.
export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return errorResponse("Unauthorized", 401)
  }

  const body = await readJsonObject(request)

  if (!body) {
    return errorResponse("Request body must be a JSON object", 400)
  }

  const roomId = readRoomId(body)

  if (!roomId) {
    return errorResponse("A room ID is required", 400)
  }

  const project = await getProjectForIdentity(roomId, identity)

  if (!project) {
    return errorResponse("Forbidden", 403)
  }

  const user = await currentUser()
  const name =
    user?.fullName ??
    user?.username ??
    identity.primaryEmail ??
    "Camely collaborator"
  const avatar = user?.imageUrl ?? ""
  const color = getCursorColor(identity.userId)
  const liveblocks = getLiveblocksClient()

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  })

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name,
      avatar,
      color,
    },
  })

  session.allow(roomId, ["*:write"])

  const { body: token, status } = await session.authorize()

  return new Response(token, { status })
}
