"use client"

import { useState } from "react"
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react"

import { AiWorkspaceSidebar } from "@/components/editor/ai-workspace-sidebar"
import { CollaborativeCanvas } from "@/components/editor/collaborative-canvas"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareDialog } from "@/hooks/use-share-dialog"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"
import { authenticateLiveblocks } from "@/lib/liveblocks-auth-client"
import type { AiDesignStatusMessage } from "@/types/ai-design"
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
  const [saveRequest, setSaveRequest] = useState(0)
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("saved")
  const [aiStatusMessages, setAiStatusMessages] = useState<
    readonly AiDesignStatusMessage[]
  >([])
  const [templateToImport, setTemplateToImport] =
    useState<CanvasTemplate | null>(null)
  const projectActions = useProjectActions({ activeProjectId: project.id })
  const shareDialog = useShareDialog({ projectId: project.id })

  return (
    <LiveblocksProvider
      authEndpoint={authenticateLiveblocks}
      preventUnsavedChanges
    >
      <RoomProvider
        id={project.id}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <div className="flex h-dvh flex-col overflow-hidden bg-base">
          <EditorNavbar
            isAiSidebarOpen={isAiSidebarOpen}
            isSidebarOpen={isSidebarOpen}
            projectName={project.name}
            saveStatus={saveStatus}
            showUserButton={false}
            onAiSidebarToggle={() => setIsAiSidebarOpen((isOpen) => !isOpen)}
            onSave={() => setSaveRequest((request) => request + 1)}
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
                isAiSidebarOpen={isAiSidebarOpen}
                onAiStatusMessagesChange={setAiStatusMessages}
                onTemplateImported={() => setTemplateToImport(null)}
                roomId={project.id}
                saveRequest={saveRequest}
                onSaveStatusChange={setSaveStatus}
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

            <AiWorkspaceSidebar
              isOpen={isAiSidebarOpen}
              onClose={() => setIsAiSidebarOpen(false)}
              roomId={project.id}
              statusMessages={aiStatusMessages}
            />
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
      </RoomProvider>
    </LiveblocksProvider>
  )
}
