"use client"

import { useState } from "react"
import { Bot, Sparkles } from "lucide-react"

import { CollaborativeCanvas } from "@/components/editor/collaborative-canvas"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareDialog } from "@/hooks/use-share-dialog"
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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [templateToImport, setTemplateToImport] =
    useState<CanvasTemplate | null>(null)
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
        onStarterTemplates={() => setIsTemplatesOpen(true)}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <main
          aria-label={`${project.name} canvas`}
          className="absolute inset-0 bg-base"
        >
          <CollaborativeCanvas
            onTemplateImported={() => setTemplateToImport(null)}
            roomId={project.id}
            templateToImport={templateToImport}
          />
        </main>

        <ProjectSidebar
          activeProjectId={project.id}
          isOpen={isSidebarOpen}
          layout="canvas-overlay"
          onClose={() => setIsSidebarOpen(false)}
          onCreate={projectActions.openCreate}
          onDelete={projectActions.openDelete}
          onRename={projectActions.openRename}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
        />

        <aside
          id="ai-sidebar"
          aria-label="AI assistant"
          aria-hidden={!isAiSidebarOpen}
          inert={!isAiSidebarOpen}
          className={`absolute bottom-3 right-3 top-3 z-40 flex w-[min(19.5rem,calc(100vw-1.5rem))] flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-sm transition-transform duration-200 ease-out ${
            isAiSidebarOpen
              ? "translate-x-0"
              : "translate-x-[calc(100%+0.75rem)] pointer-events-none"
          }`}
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

      <ProjectDialogs controller={projectActions} />
      <ShareDialog
        controller={shareDialog}
        isOwner={project.access === "owned"}
        projectName={project.name}
      />
      <StarterTemplatesModal
        isOpen={isTemplatesOpen}
        onImport={setTemplateToImport}
        onOpenChange={setIsTemplatesOpen}
      />
    </div>
  )
}
