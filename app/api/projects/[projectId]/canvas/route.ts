import { get, put } from "@vercel/blob"

import { isCanvasSnapshot } from "@/lib/canvas-snapshot"
import { errorResponse, readJsonObject } from "@/lib/project-api"
import { getCurrentClerkIdentity } from "@/lib/project-access"
import { prisma, withPrismaConnectionRetry } from "@/lib/prisma"

async function getAuthorizedProject(projectId: string) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return { error: errorResponse("Unauthorized", 401) } as const
  }

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
                    some: { email: identity.primaryEmail },
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        canvasJsonPath: true,
        updatedAt: true,
      },
    }),
  )

  if (!project) {
    return { error: errorResponse("Project not found", 404) } as const
  }

  return { project } as const
}

// GET /api/projects/[projectId]/canvas — Load the persisted canvas snapshot.
export async function GET(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]/canvas">,
) {
  const { projectId } = await context.params
  const authorization = await getAuthorizedProject(projectId)

  if ("error" in authorization) {
    return authorization.error
  }

  if (!authorization.project.canvasJsonPath) {
    return new Response(null, { status: 204 })
  }

  try {
    const blobUrl = new URL(authorization.project.canvasJsonPath)
    blobUrl.searchParams.set(
      "v",
      authorization.project.updatedAt.getTime().toString(),
    )
    const blob = await get(blobUrl.toString(), {
      access: "private",
    })

    if (!blob || blob.statusCode !== 200) {
      return errorResponse("Saved canvas not found", 404)
    }

    const snapshot: unknown = await new Response(blob.stream).json()

    if (!isCanvasSnapshot(snapshot)) {
      return errorResponse("Saved canvas is invalid", 502)
    }

    return Response.json(snapshot)
  } catch (error) {
    console.error("Canvas load failed", error)
    return errorResponse("Unable to load canvas", 502)
  }
}

// PUT /api/projects/[projectId]/canvas — Persist the latest canvas snapshot.
export async function PUT(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/canvas">,
) {
  const { projectId } = await context.params
  const authorization = await getAuthorizedProject(projectId)

  if ("error" in authorization) {
    return authorization.error
  }

  const body = await readJsonObject(request)

  if (!body || !isCanvasSnapshot(body)) {
    return errorResponse("Canvas must contain valid nodes and edges", 400)
  }

  try {
    const blob = await put(`canvas/${projectId}.json`, JSON.stringify(body), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json",
    })

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    })

    return Response.json({ saved: true })
  } catch (error) {
    console.error("Canvas save failed", error)
    return errorResponse("Unable to save canvas", 502)
  }
}
