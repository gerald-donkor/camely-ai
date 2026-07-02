import "server-only"

import { prisma } from "@/lib/prisma"
import type { Project } from "@/types/project"

const PROJECT_LIST_SELECT = {
  id: true,
  name: true,
} as const

interface ProjectLists {
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export async function getProjectLists(
  userId: string,
  email: string | null,
): Promise<ProjectLists> {
  const [ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: PROJECT_LIST_SELECT,
    }),
    email
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: { some: { email } },
          },
          orderBy: { updatedAt: "desc" },
          select: PROJECT_LIST_SELECT,
        })
      : Promise.resolve([]),
  ])

  return {
    ownedProjects: ownedProjects.map((project) => ({
      ...project,
      access: "owned",
    })),
    sharedProjects: sharedProjects.map((project) => ({
      ...project,
      access: "shared",
    })),
  }
}
