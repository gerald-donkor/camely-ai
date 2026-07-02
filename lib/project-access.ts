import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import type { Project } from "@/types/project"

export interface ClerkIdentity {
  userId: string
  primaryEmail: string | null
}

export async function getCurrentClerkIdentity(): Promise<ClerkIdentity | null> {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const user = await currentUser()

  return {
    userId,
    primaryEmail:
      user?.primaryEmailAddress?.emailAddress.toLowerCase() ?? null,
  }
}

export async function getProjectForIdentity(
  roomId: string,
  identity: ClerkIdentity,
): Promise<Project | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: roomId,
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
      ownerId: true,
    },
  })

  if (!project) {
    return null
  }

  return {
    id: project.id,
    name: project.name,
    access: project.ownerId === identity.userId ? "owned" : "shared",
  }
}
