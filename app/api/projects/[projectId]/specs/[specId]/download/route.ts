import { get } from "@vercel/blob"

import { errorResponse } from "@/lib/project-api"
import { getCurrentClerkIdentity } from "@/lib/project-access"
import { prisma, withPrismaConnectionRetry } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{
    projectId: string
    specId: string
  }>
}

// GET /api/projects/[projectId]/specs/[specId]/download — Download a persisted technical specification.
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { projectId, specId } = await context.params

  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return errorResponse("Unauthorized", 401)
  }

  // Verify that the project exists and the user is an owner or collaborator
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
        id: true,
        name: true,
      },
    }),
  )

  if (!project) {
    return errorResponse("Project not found", 404)
  }

  // Verify that the specification exists and belongs to this project
  const spec = await withPrismaConnectionRetry(() =>
    prisma.projectSpec.findFirst({
      where: {
        id: specId,
        projectId: projectId,
      },
      select: {
        filePath: true,
      },
    }),
  )

  if (!spec) {
    return errorResponse("Specification not found", 404)
  }

  try {
    const blob = await get(spec.filePath, {
      access: "private",
    })

    if (!blob || blob.statusCode !== 200) {
      return errorResponse("Saved specification content not found", 404)
    }

    const markdownContent = await new Response(blob.stream).text()

    const safeProjectName = project.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"

    const filename = `${safeProjectName}-spec.md`

    return new Response(markdownContent, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Specification download failed", error)
    return errorResponse("Unable to download specification", 502)
  }
}
