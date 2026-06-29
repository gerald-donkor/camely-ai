"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen
  const toggleLabel = isSidebarOpen
    ? "Close project sidebar"
    : "Open project sidebar"

  return (
    <header className="grid h-14 shrink-0 grid-cols-3 items-center border-b border-surface-border bg-surface px-3">
      <div className="flex items-center justify-start">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={toggleLabel}
          aria-expanded={isSidebarOpen}
          aria-controls="project-sidebar"
          onClick={onSidebarToggle}
        >
          <SidebarIcon aria-hidden="true" />
        </Button>
      </div>
      <div className="flex items-center justify-center" />
      <div className="flex items-center justify-end" />
    </header>
  )
}
