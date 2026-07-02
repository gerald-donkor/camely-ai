"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { Project } from "@/types/project"

interface EditorWorkspaceProps {
  activeProjectId?: string
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export function EditorWorkspace({
  activeProjectId,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const projectActions = useProjectActions({ activeProjectId })

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCreate={projectActions.openCreate}
        onDelete={projectActions.openDelete}
        onRename={projectActions.openRename}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
      />
      <main
        aria-label="System design canvas"
        className="relative min-h-0 flex-1 overflow-hidden bg-base"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(var(--border-default)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"
        />
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
          <div className="max-w-lg">
            <h1 className="text-2xl font-semibold tracking-tight text-copy-primary">
              Create a project or open an existing one
            </h1>
            <p className="mt-3 text-sm leading-6 text-copy-muted">
              Start a new architecture workspace, or choose a project from the
              sidebar.
            </p>
            <Button
              type="button"
              className="mt-6"
              onClick={projectActions.openCreate}
            >
              <Plus aria-hidden="true" />
              New Project
            </Button>
          </div>
        </div>
      </main>
      <ProjectDialogs controller={projectActions} />
    </div>
  )
}
