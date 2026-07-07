import { tasks } from "@trigger.dev/sdk"

import type { designAgent } from "@/src/trigger/design-agent"
import { getCurrentClerkIdentity } from "@/lib/project-access"
import { errorResponse, readJsonObject } from "@/lib/project-api"
import { prisma, withPrismaConnectionRetry } from "@/lib/prisma"

interface DesignRequest {
  prompt: string
  projectId: string
  roomId: string
}

function readNonEmptyString(
  body: Record<string, unknown>,
  key: keyof DesignRequest,
) {
  const value = body[key]

  return typeof value === "string" && value.trim() ? value.trim() : null
}

async function authorizeProjectMember(
  projectId: string,
  identity: { primaryEmail: string | null; userId: string },
) {
  const project = await withPrismaConnectionRetry(() =>
    prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: identity.userId },
          ...(identity.primaryEmail
            ? [
                {
                  collaborators: {
                    some: {
                      email: identity.primaryEmail,
                    },
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
      },
    }),
  )

  return Boolean(project)
}

// POST /api/ai/design - Trigger the backend design generation task.
export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return errorResponse("Unauthorized", 401)
  }

  const body = await readJsonObject(request)

  if (!body) {
    return errorResponse("Request body must be a JSON object", 400)
  }

  const prompt = readNonEmptyString(body, "prompt")
  const roomId = readNonEmptyString(body, "roomId")
  const projectId = readNonEmptyString(body, "projectId") ?? roomId

  if (!prompt) {
    return errorResponse("Prompt must be a non-empty string", 400)
  }

  if (!roomId) {
    return errorResponse("Room ID must be a non-empty string", 400)
  }

  if (roomId !== projectId) {
    return errorResponse("Room ID must match project ID", 400)
  }

  const isProjectMember = await authorizeProjectMember(projectId, identity)

  if (!isProjectMember) {
    return errorResponse("Project not found", 404)
  }

  try {
    const handle = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt,
      roomId,
    })

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId: identity.userId,
      },
    })

    return Response.json({
      publicToken: handle.publicAccessToken,
      runId: handle.id,
    })
  } catch (error) {
    console.error("Design task trigger failed", error)
    return errorResponse("Unable to trigger design generation", 502)
  }
}
