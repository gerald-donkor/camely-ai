"use client"

import { useEffect, useState } from "react"

import type {
  Collaborator,
  ProjectOwner,
} from "@/types/collaborator"

interface UseShareDialogOptions {
  projectId: string
}

function isCollaborator(value: unknown): value is Collaborator {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    typeof value.email === "string" &&
    "displayName" in value &&
    (typeof value.displayName === "string" || value.displayName === null) &&
    "imageUrl" in value &&
    (typeof value.imageUrl === "string" || value.imageUrl === null)
  )
}

function isProjectOwner(value: unknown): value is ProjectOwner {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    (typeof value.email === "string" || value.email === null) &&
    "displayName" in value &&
    typeof value.displayName === "string" &&
    "imageUrl" in value &&
    (typeof value.imageUrl === "string" || value.imageUrl === null)
  )
}

function readCollaborators(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    !("owner" in value) ||
    !isProjectOwner(value.owner) ||
    !("collaborators" in value) ||
    !Array.isArray(value.collaborators) ||
    !value.collaborators.every(isCollaborator)
  ) {
    return null
  }

  return {
    owner: value.owner,
    collaborators: value.collaborators,
  }
}

async function readError(response: Response) {
  const body: unknown = await response.json().catch(() => null)

  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error
  }

  return "Something went wrong. Please try again."
}

export function useShareDialog({ projectId }: UseShareDialogOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [email, setEmail] = useState("")
  const [owner, setOwner] = useState<ProjectOwner | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) {
      return
    }

    const timeout = window.setTimeout(() => setIsCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [isCopied])

  async function loadCollaborators() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators`,
      )

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const body: unknown = await response.json()
      const projectAccess = readCollaborators(body)

      if (!projectAccess) {
        throw new Error("The collaborator response was invalid.")
      }

      setOwner(projectAccess.owner)
      setCollaborators(projectAccess.collaborators)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  function openDialog() {
    setIsOpen(true)
    setEmail("")
    setIsCopied(false)
    void loadCollaborators()
  }

  function closeDialog() {
    if (!isMutating) {
      setIsOpen(false)
      setEmail("")
      setErrorMessage(null)
    }
  }

  async function inviteCollaborator() {
    const nextEmail = email.trim()

    if (!nextEmail || isMutating) {
      return
    }

    setIsMutating(true)
    setErrorMessage(null)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: nextEmail }),
        },
      )

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      setEmail("")
      await loadCollaborators()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      )
    } finally {
      setIsMutating(false)
    }
  }

  async function removeCollaborator(collaboratorEmail: string) {
    if (isMutating) {
      return
    }

    setIsMutating(true)
    setErrorMessage(null)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: collaboratorEmail }),
        },
      )

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      setCollaborators((current) =>
        current.filter(({ email }) => email !== collaboratorEmail),
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      )
    } finally {
      setIsMutating(false)
    }
  }

  async function copyProjectLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/editor/${projectId}`,
      )
      setIsCopied(true)
    } catch {
      setErrorMessage("The project link could not be copied.")
    }
  }

  return {
    closeDialog,
    collaborators,
    copyProjectLink,
    email,
    errorMessage,
    inviteCollaborator,
    isCopied,
    isLoading,
    isMutating,
    isOpen,
    openDialog,
    owner,
    removeCollaborator,
    setEmail,
  }
}

export type ShareDialogController = ReturnType<typeof useShareDialog>
