import {
  enrichCollaboratorEmails,
  getProjectOwner,
} from "@/lib/collaborators"
import {
  errorResponse,
  readJsonObject,
} from "@/lib/project-api"
import { getCurrentClerkIdentity } from "@/lib/project-access"
import { prisma, withPrismaConnectionRetry } from "@/lib/prisma"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function getProjectMembership(projectId: string) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    return { error: errorResponse("Unauthorized", 401) } as const
  }

  const project = await withPrismaConnectionRetry(() =>
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ownerId: true,
        collaborators: {
          orderBy: { createdAt: "asc" },
          select: { email: true },
        },
      },
    }),
  )

  if (!project) {
    return { error: errorResponse("Project not found", 404) } as const
  }

  const isOwner = project.ownerId === identity.userId
  const isCollaborator =
    identity.primaryEmail !== null &&
    project.collaborators.some(
      ({ email }) => email === identity.primaryEmail?.toLowerCase(),
    )

  if (!isOwner && !isCollaborator) {
    return { error: errorResponse("Forbidden", 403) } as const
  }

  return { identity, isOwner, project } as const
}

function readEmail(body: Record<string, unknown>) {
  if (typeof body.email !== "string") {
    return null
  }

  const email = body.email.trim().toLowerCase()
  return EMAIL_PATTERN.test(email) ? email : null
}

// GET /api/projects/[projectId]/collaborators — List project collaborators.
export async function GET(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]/collaborators">,
) {
  const { projectId } = await context.params
  const membership = await getProjectMembership(projectId)

  if ("error" in membership) {
    return membership.error
  }

  const [owner, collaborators] = await Promise.all([
    getProjectOwner(membership.project.ownerId),
    enrichCollaboratorEmails(
      membership.project.collaborators.map(({ email }) => email),
    ),
  ])

  return Response.json({ owner, collaborators })
}

// POST /api/projects/[projectId]/collaborators — Invite by email.
export async function POST(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/collaborators">,
) {
  const { projectId } = await context.params
  const membership = await getProjectMembership(projectId)

  if ("error" in membership) {
    return membership.error
  }

  if (!membership.isOwner) {
    return errorResponse("Forbidden", 403)
  }

  const body = await readJsonObject(request)

  if (!body) {
    return errorResponse("Request body must be a JSON object", 400)
  }

  const email = readEmail(body)

  if (!email) {
    return errorResponse("A valid email address is required", 400)
  }

  if (email === membership.identity.primaryEmail?.toLowerCase()) {
    return errorResponse("The project owner already has access", 400)
  }

  await prisma.projectCollaborator.upsert({
    where: {
      projectId_email: {
        projectId,
        email,
      },
    },
    create: {
      projectId,
      email,
    },
    update: {},
  })

  const [collaborator] = await enrichCollaboratorEmails([email])

  return Response.json({ collaborator }, { status: 201 })
}

// DELETE /api/projects/[projectId]/collaborators — Remove by email.
export async function DELETE(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/collaborators">,
) {
  const { projectId } = await context.params
  const membership = await getProjectMembership(projectId)

  if ("error" in membership) {
    return membership.error
  }

  if (!membership.isOwner) {
    return errorResponse("Forbidden", 403)
  }

  const body = await readJsonObject(request)

  if (!body) {
    return errorResponse("Request body must be a JSON object", 400)
  }

  const email = readEmail(body)

  if (!email) {
    return errorResponse("A valid email address is required", 400)
  }

  const result = await prisma.projectCollaborator.deleteMany({
    where: {
      projectId,
      email,
    },
  })

  if (result.count === 0) {
    return errorResponse("Collaborator not found", 404)
  }

  return Response.json({ success: true })
}
