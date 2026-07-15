import { auth } from "@clerk/nextjs/server"
import { unstable_noStore as noStore } from "next/cache"

// Public project fields returned consistently by every project endpoint.
export const PROJECT_SELECT = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  status: true,
  canvasJsonPath: true,
  createdAt: true,
  updatedAt: true,
} as const

// Resolve the current Clerk user without redirecting API requests.
export async function getAuthenticatedUserId() {
  noStore()
  const { isAuthenticated, userId } = await auth()

  return isAuthenticated ? userId : null
}

// Safely narrow an unknown JSON request body to a plain object.
export async function readJsonObject(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return null
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null
  }

  return body as Record<string, unknown>
}

// Keep API error responses consistent across route handlers.
export function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
