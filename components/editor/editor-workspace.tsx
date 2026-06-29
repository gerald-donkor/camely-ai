"use client"

import { useState } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"

export function EditorWorkspace() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main
        aria-label="System design canvas"
        className="relative min-h-0 flex-1 overflow-hidden bg-base"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(var(--border-default)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"
        />
      </main>
    </div>
  )
}
