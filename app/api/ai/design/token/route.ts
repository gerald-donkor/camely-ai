import { auth } from "@trigger.dev/sdk"

import {
  errorResponse,
  getAuthenticatedUserId,
  readJsonObject,
} from "@/lib/project-api"
import { prisma, withPrismaConnectionRetry } from "@/lib/prisma"

function readRunId(body: Record<string, unknown>) {
  return typeof body.runId === "string" && body.runId.trim()
    ? body.runId.trim()
    : null
}

// POST /api/ai/design/token - Issue a run-scoped Trigger.dev public token.
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    return errorResponse("Unauthorized", 401)
  }

  const body = await readJsonObject(request)

  if (!body) {
    return errorResponse("Request body must be a JSON object", 400)
  }

  const runId = readRunId(body)

  if (!runId) {
    return errorResponse("Run ID must be a non-empty string", 400)
  }

  const taskRun = await withPrismaConnectionRetry(() =>
    prisma.taskRun.findFirst({
      where: {
        runId,
        userId,
      },
      select: {
        runId: true,
      },
    }),
  )

  if (!taskRun) {
    return errorResponse("Task run not found", 404)
  }

  try {
    const token = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [taskRun.runId],
        },
      },
    })

    return Response.json({ token })
  } catch (error) {
    console.error("Design task token creation failed", error)
    return errorResponse("Unable to create design task token", 502)
  }
}
