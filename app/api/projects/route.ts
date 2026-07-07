import {
  errorResponse,
  getAuthenticatedUserId,
  PROJECT_SELECT,
  readJsonObject,
} from "@/lib/project-api"
import { prisma, withPrismaConnectionRetry } from "@/lib/prisma"

const DEFAULT_PROJECT_NAME = "Untitled Project"

// GET /api/projects — List projects owned by the signed-in Clerk user.
export async function GET() {
  // Authentication
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    return errorResponse("Unauthorized", 401)
  }

  // Database query
  const projects = await withPrismaConnectionRetry(() =>
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: PROJECT_SELECT,
    }),
  )

  return Response.json({ projects })
}

// POST /api/projects — Create a project for the signed-in Clerk user.
export async function POST(request: Request) {
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

  if (body.name !== undefined && typeof body.name !== "string") {
    return errorResponse("Project name must be a string", 400)
  }

  if (
    body.id !== undefined &&
    (typeof body.id !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.id))
  ) {
    return errorResponse("Project ID must be a lowercase room ID", 400)
  }

  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : DEFAULT_PROJECT_NAME

  // Project creation
  const project = await prisma.project.create({
    data: {
      ...(typeof body.id === "string" ? { id: body.id } : {}),
      ownerId: userId,
      name,
    },
    select: PROJECT_SELECT,
  })

  return Response.json({ project }, { status: 201 })
}
