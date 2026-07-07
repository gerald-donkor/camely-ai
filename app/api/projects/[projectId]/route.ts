import {
  errorResponse,
  getAuthenticatedUserId,
  PROJECT_SELECT,
  readJsonObject,
} from "@/lib/project-api"
import { prisma, withPrismaConnectionRetry } from "@/lib/prisma"

// Confirm the project exists and the signed-in user is its owner.
async function authorizeOwner(projectId: string, userId: string) {
  const project = await withPrismaConnectionRetry(() =>
    prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    }),
  )

  if (!project) {
    return errorResponse("Project not found", 404)
  }

  if (project.ownerId !== userId) {
    return errorResponse("Forbidden", 403)
  }

  return null
}

// PATCH /api/projects/[projectId] — Rename an owned project.
export async function PATCH(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]">,
) {
  // Authentication
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    return errorResponse("Unauthorized", 401)
  }

  // Request validation
  const body = await readJsonObject(request)

  if (!body) {
    return errorResponse("Request body must be a JSON object", 400)
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return errorResponse("Project name must be a non-empty string", 400)
  }

  // Owner authorization
  const { projectId } = await context.params
  const authorizationError = await authorizeOwner(projectId, userId)

  if (authorizationError) {
    return authorizationError
  }

  // Project update
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name: body.name.trim() },
    select: PROJECT_SELECT,
  })

  return Response.json({ project })
}

// DELETE /api/projects/[projectId] — Permanently delete an owned project.
export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]">,
) {
  // Authentication
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    return errorResponse("Unauthorized", 401)
  }

  // Owner authorization
  const { projectId } = await context.params
  const authorizationError = await authorizeOwner(projectId, userId)

  if (authorizationError) {
    return authorizationError
  }

  // Project deletion
  await prisma.project.delete({
    where: { id: projectId },
  })

  return Response.json({ success: true })
}
