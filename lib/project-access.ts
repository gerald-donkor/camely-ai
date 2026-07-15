import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"
import { unstable_noStore as noStore } from "next/cache"

import { prisma, withPrismaConnectionRetry } from "@/lib/prisma"
import type { Project } from "@/types/project"

export interface ClerkIdentity {
  avatarUrl: string
  displayName: string
  userId: string
  primaryEmail: string | null
}

export async function getCurrentClerkIdentity(): Promise<ClerkIdentity | null> {
  noStore()
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const user = await currentUser()
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress.toLowerCase() ?? null

  return {
    avatarUrl: user?.imageUrl ?? "",
    displayName:
      user?.fullName ??
      user?.username ??
      primaryEmail ??
      "Camely collaborator",
    userId,
    primaryEmail,
  }
}

export async function getProjectForIdentity(
  roomId: string,
  identity: ClerkIdentity,
): Promise<Project | null> {
  const project = await withPrismaConnectionRetry(() =>
    prisma.project.findFirst({
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
    }),
  )

  if (!project) {
    return null
  }

  return {
    id: project.id,
    name: project.name,
    access: project.ownerId === identity.userId ? "owned" : "shared",
  }
}
