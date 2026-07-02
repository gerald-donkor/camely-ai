"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type { Project } from "@/types/project"

type ProjectDialogState =
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }
  | null

interface UseProjectActionsOptions {
  activeProjectId?: string
}

interface ProjectResponse {
  project: {
    id: string
    name: string
  }
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function createShortSuffix() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 6)
}

function isProjectResponse(value: unknown): value is ProjectResponse {
  if (typeof value !== "object" || value === null || !("project" in value)) {
    return false
  }

  const project = value.project

  return (
    typeof project === "object" &&
    project !== null &&
    "id" in project &&
    typeof project.id === "string" &&
    "name" in project &&
    typeof project.name === "string"
  )
}

async function getErrorMessage(response: Response) {
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

export function useProjectActions({
  activeProjectId,
}: UseProjectActionsOptions = {}) {
  const router = useRouter()
  const [dialog, setDialog] = useState<ProjectDialogState>(null)
  const [projectName, setProjectName] = useState("")
  const [roomSuffix, setRoomSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const roomIdPreview = useMemo(() => {
    if (!roomSuffix) {
      return ""
    }

    return `${toSlug(projectName) || "untitled-project"}-${roomSuffix}`
  }, [projectName, roomSuffix])

  function openCreate() {
    setProjectName("")
    setRoomSuffix(createShortSuffix())
    setErrorMessage(null)
    setDialog({ type: "create" })
  }

  function openRename(project: Project) {
    setProjectName(project.name)
    setRoomSuffix("")
    setErrorMessage(null)
    setDialog({ type: "rename", project })
  }

  function openDelete(project: Project) {
    setProjectName("")
    setRoomSuffix("")
    setErrorMessage(null)
    setDialog({ type: "delete", project })
  }

  function closeDialog() {
    if (!isLoading) {
      setDialog(null)
      setProjectName("")
      setRoomSuffix("")
      setErrorMessage(null)
    }
  }

  async function submitDialog() {
    if (!dialog || isLoading) {
      return
    }

    const name = projectName.trim()

    if (dialog.type !== "delete" && !name) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      if (dialog.type === "create") {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: roomIdPreview, name }),
        })

        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const body: unknown = await response.json()

        if (!isProjectResponse(body) || body.project.id !== roomIdPreview) {
          throw new Error("The project response was invalid.")
        }

        setDialog(null)
        router.push(`/editor/${body.project.id}`)
        return
      }

      if (dialog.type === "rename") {
        const response = await fetch(`/api/projects/${dialog.project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })

        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        setDialog(null)
        router.refresh()
        return
      }

      const response = await fetch(`/api/projects/${dialog.project.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setDialog(null)

      if (dialog.project.id === activeProjectId) {
        router.replace("/editor")
      } else {
        router.refresh()
      }
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

  return {
    closeDialog,
    dialog,
    errorMessage,
    isLoading,
    openCreate,
    openDelete,
    openRename,
    projectName,
    roomIdPreview,
    setProjectName,
    submitDialog,
  }
}

export type ProjectActionsController = ReturnType<typeof useProjectActions>
