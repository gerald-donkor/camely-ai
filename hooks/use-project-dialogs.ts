"use client"

import { useMemo, useState } from "react"

import type { Project } from "@/types/project"

type ProjectDialogState =
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }
  | null

const initialProjects: Project[] = [
  {
    id: "project-commerce-platform",
    name: "Commerce Platform",
    slug: "commerce-platform",
    access: "owned",
  },
  {
    id: "project-notification-service",
    name: "Notification Service",
    slug: "notification-service",
    access: "owned",
  },
  {
    id: "project-shared-analytics",
    name: "Analytics Pipeline",
    slug: "analytics-pipeline",
    access: "shared",
  },
]

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [dialog, setDialog] = useState<ProjectDialogState>(null)
  const [projectName, setProjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const slugPreview = useMemo(() => toSlug(projectName), [projectName])

  function openCreate() {
    setProjectName("")
    setDialog({ type: "create" })
  }

  function openRename(project: Project) {
    setProjectName(project.name)
    setDialog({ type: "rename", project })
  }

  function openDelete(project: Project) {
    setProjectName("")
    setDialog({ type: "delete", project })
  }

  function closeDialog() {
    if (!isLoading) {
      setDialog(null)
      setProjectName("")
    }
  }

  function submitDialog() {
    if (!dialog || isLoading) {
      return
    }

    const name = projectName.trim()

    if (dialog.type !== "delete" && !name) {
      return
    }

    setIsLoading(true)

    if (dialog.type === "create") {
      const id = `mock-project-${projects.length + 1}`

      setProjects((currentProjects) => [
        ...currentProjects,
        {
          id,
          name,
          slug: toSlug(name),
          access: "owned",
        },
      ])
    }

    if (dialog.type === "rename") {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === dialog.project.id
            ? { ...project, name, slug: toSlug(name) }
            : project
        )
      )
    }

    if (dialog.type === "delete") {
      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== dialog.project.id
        )
      )
    }

    setDialog(null)
    setProjectName("")
    setIsLoading(false)
  }

  return {
    closeDialog,
    dialog,
    isLoading,
    openCreate,
    openDelete,
    openRename,
    projectName,
    projects,
    setProjectName,
    slugPreview,
    submitDialog,
  }
}

export type ProjectDialogsController = ReturnType<typeof useProjectDialogs>
