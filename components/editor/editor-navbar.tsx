"use client"

import { UserButton } from "@clerk/nextjs"
import {
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface EditorNavbarProps {
  isAiSidebarOpen?: boolean
  isSidebarOpen: boolean
  projectName?: string
  onAiSidebarToggle?: () => void
  onShare?: () => void
  onSidebarToggle: () => void
}

export function EditorNavbar({
  isAiSidebarOpen = false,
  isSidebarOpen,
  projectName,
  onAiSidebarToggle,
  onShare,
  onSidebarToggle,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen
  const toggleLabel = isSidebarOpen
    ? "Close project sidebar"
    : "Open project sidebar"

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-surface-border bg-surface px-3">
      <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
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
        {projectName && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-copy-primary">
              {projectName}
            </p>
            <p className="text-xs text-copy-faint">Workspace</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-1">
        {projectName && (
          <>
            {onShare && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Share project"
                onClick={onShare}
              >
                <Share2 aria-hidden="true" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
            {onAiSidebarToggle && (
              <Button
                type="button"
                variant={isAiSidebarOpen ? "default" : "outline"}
                size="sm"
                aria-label={
                  isAiSidebarOpen
                    ? "Close AI assistant"
                    : "Open AI assistant"
                }
                aria-expanded={isAiSidebarOpen}
                aria-controls="ai-sidebar"
                onClick={onAiSidebarToggle}
              >
                <Sparkles aria-hidden="true" />
                <span>AI</span>
              </Button>
            )}
          </>
        )}
            <Button
              type="button"
              variant={isAiSidebarOpen ? "default" : "outline"}
              size="sm"
              aria-label={
                isAiSidebarOpen
                  ? "Close AI assistant"
                  : "Open AI assistant"
              }
              aria-expanded={isAiSidebarOpen}
              aria-controls="ai-sidebar"
              onClick={onAiSidebarToggle}
            >
              <Sparkles aria-hidden="true" />
              <span>AI</span>
            </Button>
          </>
        )}
        <UserButton />
      </div>
    </header>
  )
}
