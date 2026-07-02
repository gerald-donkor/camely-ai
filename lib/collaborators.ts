import "server-only"

import { clerkClient } from "@clerk/nextjs/server"

import type {
  Collaborator,
  ProjectOwner,
} from "@/types/collaborator"

export async function getProjectOwner(
  ownerId: string,
): Promise<ProjectOwner> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(ownerId)
    const primaryEmail = user.emailAddresses.find(
      ({ id }) => id === user.primaryEmailAddressId,
    )

    return {
      email:
        primaryEmail?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        null,
      displayName: user.fullName ?? user.username ?? "Project owner",
      imageUrl: user.imageUrl,
    }
  } catch {
    return {
      email: null,
      displayName: "Project owner",
      imageUrl: null,
    }
  }
}

export async function enrichCollaboratorEmails(
  emails: string[],
): Promise<Collaborator[]> {
  if (emails.length === 0) {
    return []
  }

  try {
    const client = await clerkClient()
    const { data: users } = await client.users.getUserList({
      emailAddress: emails,
      limit: Math.min(emails.length, 500),
    })

    return emails.map((email) => {
      const user = users.find((candidate) =>
        candidate.emailAddresses.some(
          (address) =>
            address.emailAddress.toLowerCase() === email.toLowerCase(),
        ),
      )

      return {
        email,
        displayName: user?.fullName ?? null,
        imageUrl: user?.imageUrl ?? null,
      }
    })
  } catch {
    return emails.map((email) => ({
      email,
      displayName: null,
      imageUrl: null,
    }))
  }
}
