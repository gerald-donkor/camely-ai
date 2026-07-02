"use client"

import { useState } from "react"
import { Bot, Compass, Sparkles } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareDialog } from "@/hooks/use-share-dialog"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

interface ProjectWorkspaceProps {
  ownedProjects: Project[]
  project: Project
  sharedProjects: Project[]
}

export function ProjectWorkspace({
  ownedProjects,
  project,
  sharedProjects,
}: ProjectWorkspaceProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true)
  const projectActions = useProjectActions({ activeProjectId: project.id })
  const shareDialog = useShareDialog({ projectId: project.id })

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-base">
      <EditorNavbar
        isAiSidebarOpen={isAiSidebarOpen}
        isSidebarOpen={isSidebarOpen}
        projectName={project.name}
        onAiSidebarToggle={() => setIsAiSidebarOpen((isOpen) => !isOpen)}
        onShare={shareDialog.openDialog}
        onSidebarToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />

      <div
        className={cn(
          "grid min-h-0 flex-1 gap-3 p-3 transition-[grid-template-columns] duration-200 lg:grid-cols-[20rem_minmax(0,1fr)_22rem]",
          !isSidebarOpen && "lg:grid-cols-[0_minmax(0,1fr)_22rem]",
          !isAiSidebarOpen && "lg:grid-cols-[20rem_minmax(0,1fr)_0]",
          !isSidebarOpen &&
            !isAiSidebarOpen &&
            "lg:grid-cols-[0_minmax(0,1fr)_0]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ProjectSidebar
            activeProjectId={project.id}
            isOpen={isSidebarOpen}
            layout="docked"
            onClose={() => setIsSidebarOpen(false)}
            onCreate={projectActions.openCreate}
            onDelete={projectActions.openDelete}
            onRename={projectActions.openRename}
            ownedProjects={ownedProjects}
            sharedProjects={sharedProjects}
          />
        </div>

        <main
          aria-label={`${project.name} canvas`}
          className="relative min-h-0 overflow-hidden rounded-3xl border border-surface-border bg-surface"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(var(--border-default)_1px,transparent_1px),linear-gradient(90deg,var(--border-default)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,var(--accent-primary-dim),transparent_70%)]"
          />
          <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
            <div className="max-w-xl">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-surface-border-subtle bg-elevated text-brand">
                <Compass aria-hidden="true" className="size-7" />
              </div>
              <p className="mt-6 text-xs font-medium uppercase tracking-[0.28em] text-copy-faint">
                Workspace shell
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-copy-primary">
                Canvas and collaboration tooling land here next.
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-copy-muted">
                This room is ready for the shared architecture canvas, durable
                AI workflows, and real-time presence. For now, the shell is
                wired with project context and navigation only.
              </p>
            </div>
          </div>
        </main>

        <div className="min-h-0 overflow-hidden">
          <aside
            id="ai-sidebar"
            aria-label="AI assistant"
            aria-hidden={!isAiSidebarOpen}
            inert={!isAiSidebarOpen}
            className={cn(
              "fixed bottom-3 right-3 top-19 z-40 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-sm transition-transform duration-200 ease-out lg:static lg:h-full lg:w-full lg:shadow-none",
              isAiSidebarOpen
                ? "translate-x-0"
                : "translate-x-[calc(100%+0.75rem)] pointer-events-none",
            )}
          >
            <div className="flex items-start justify-between border-b border-surface-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-copy-primary">
                  AI Copilot
                </h2>
                <p className="mt-0.5 text-xs text-copy-faint">
                  Placeholder panel
                </p>
              </div>
              <Sparkles aria-hidden="true" className="size-4 text-ai-text" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
              <div className="rounded-2xl border border-surface-border-subtle bg-elevated p-4">
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
                    <Bot aria-hidden="true" className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-copy-primary">
                      Chat surface pending
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-copy-muted">
                      The toggle is wired. Messaging and generation are
                      intentionally out of scope here.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto rounded-2xl border border-dashed border-surface-border-subtle bg-base/60 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-copy-faint">
                  Future hooks
                </p>
                <p className="mt-3 text-sm leading-6 text-copy-muted">
                  Prompt composer, run status, and architecture guidance will
                  attach to this sidebar.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ProjectDialogs controller={projectActions} />
      <ShareDialog
        controller={shareDialog}
        isOwner={project.access === "owned"}
        projectName={project.name}
      />
    </div>
  )
}
