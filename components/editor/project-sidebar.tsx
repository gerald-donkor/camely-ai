"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  onCreate: () => void
  onDelete: (project: Project) => void
  onRename: (project: Project) => void
  ownedProjects: Project[]
  sharedProjects: Project[]
}

interface ProjectListProps {
  emptyDescription: string
  onDelete?: (project: Project) => void
  onRename?: (project: Project) => void
  projects: Project[]
}

function ProjectList({
  emptyDescription,
  onDelete,
  onRename,
  projects,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-surface-border p-6 text-center">
        <p className="text-sm text-copy-muted">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <ul className="space-y-1">
      {projects.map((project) => (
        <li
          key={project.id}
          className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-subtle"
        >
          <Link
            href={`/editor/${project.id}`}
            className="min-w-0 flex-1 truncate text-sm text-copy-secondary hover:text-copy-primary"
          >
            {project.name}
          </Link>
          {project.access === "owned" && onRename && onDelete && (
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Rename ${project.name}`}
                onClick={() => onRename(project)}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-error hover:text-error"
                aria-label={`Delete ${project.name}`}
                onClick={() => onDelete(project)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onCreate,
  onDelete,
  onRename,
  ownedProjects,
  sharedProjects,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close project sidebar"
          className="fixed inset-x-0 bottom-0 top-14 z-30 bg-base/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="project-sidebar"
        aria-label="Projects"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "fixed bottom-3 left-3 top-17 z-40 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-sm transition-transform duration-200 ease-out",
          isOpen
            ? "translate-x-0"
            : "-translate-x-[calc(100%+0.75rem)] pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="font-heading text-base font-medium text-copy-primary">
            Projects
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close project sidebar"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="min-h-0 flex-1 p-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          <TabsContent
            value="my-projects"
            className="mt-2 min-h-0 overflow-y-auto"
          >
            <ProjectList
              projects={ownedProjects}
              emptyDescription="Your projects will appear here."
              onRename={onRename}
              onDelete={onDelete}
            />
          </TabsContent>
          <TabsContent
            value="shared"
            className="mt-2 min-h-0 overflow-y-auto"
          >
            <ProjectList
              projects={sharedProjects}
              emptyDescription="Projects shared with you will appear here."
            />
          </TabsContent>
        </Tabs>

        <div className="border-t border-surface-border p-4">
          <Button type="button" className="w-full" onClick={onCreate}>
            <Plus aria-hidden="true" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
