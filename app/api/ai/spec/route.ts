import { tasks } from "@trigger.dev/sdk"

import type { generateSpec } from "@/src/trigger/generate-spec"
import { getCurrentClerkIdentity, getProjectForIdentity } from "@/lib/project-access"
import { errorResponse, readJsonObject } from "@/lib/project-api"
import { prisma } from "@/lib/prisma"

// POST /api/ai/spec - Trigger the backend spec generation task.
export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return errorResponse("Unauthorized", 401)
  }

  const body = await readJsonObject(request)

  if (!body) {
    return errorResponse("Request body must be a JSON object", 400)
  }

  const roomId = typeof body.roomId === "string" ? body.roomId.trim() : ""
  const chatHistory = Array.isArray(body.chatHistory) ? body.chatHistory : []
  const nodes = Array.isArray(body.nodes) ? body.nodes : []
  const edges = Array.isArray(body.edges) ? body.edges : []

  if (!roomId) {
    return errorResponse("Room ID must be a non-empty string", 400)
  }

  // Verify project membership through getProjectForIdentity
  const project = await getProjectForIdentity(roomId, identity)

  if (!project) {
    return errorResponse("Project not found", 404)
  }

  try {
    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: project.id,
      roomId,
      chatHistory,
      nodes,
      edges,
    })

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: project.id,
        userId: identity.userId,
      },
    })

    return Response.json({
      publicToken: handle.publicAccessToken,
      runId: handle.id,
    })
  } catch (error) {
    console.error("Spec generation task trigger failed", error)
    return errorResponse("Unable to trigger spec generation", 502)
  }
}
