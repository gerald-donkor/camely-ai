import { errorResponse } from "@/lib/project-api"
import { getCurrentClerkIdentity } from "@/lib/project-access"
import { prisma, withPrismaConnectionRetry } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{
    projectId: string
  }>
}

// GET /api/projects/[projectId]/specs — List specs for a project.
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { projectId } = await context.params

  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return errorResponse("Unauthorized", 401)
  }

  // Verify project membership (owner or collaborator)
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
      },
    }),
  )

  if (!project) {
    return errorResponse("Project not found", 404)
  }

  try {
    const specs = await withPrismaConnectionRetry(() =>
      prisma.projectSpec.findMany({
        where: {
          projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          projectId: true,
          filePath: true,
          createdAt: true,
        },
      }),
    )

    return Response.json({ specs })
  } catch (error) {
    console.error("Specs query failed", error)
    return errorResponse("Unable to fetch project specifications", 502)
  }
}
