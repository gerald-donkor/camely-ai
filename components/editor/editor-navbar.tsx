"use client"

import { UserButton } from "@clerk/nextjs"
import {
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
      <div className="flex shrink-0 items-center justify-end gap-2 rounded-xl border border-surface-border bg-elevated/80 p-1 shadow-sm">
        {projectName && (
          <>
            {onShare && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                className="h-8 rounded-lg px-3 text-copy-secondary hover:bg-subtle hover:text-copy-primary"
                aria-label="Share project"
                onClick={onShare}
              >
                <Share2 aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
            {onAiSidebarToggle && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                className={cn(
                  "group/ai relative h-8 overflow-hidden rounded-lg border px-3 transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-px active:translate-y-0",
                  isAiSidebarOpen
                    ? "border-ai/60 bg-[linear-gradient(135deg,var(--accent-ai),var(--accent-primary))] text-copy-primary shadow-[0_0_18px_color-mix(in_srgb,var(--accent-ai)_30%,transparent)] hover:border-brand hover:shadow-[0_0_24px_color-mix(in_srgb,var(--accent-primary)_35%,transparent)]"
                    : "border-surface-border bg-base/40 text-copy-secondary hover:border-ai/60 hover:bg-[linear-gradient(135deg,var(--accent-ai),var(--accent-primary))] hover:text-copy-primary hover:shadow-[0_0_20px_color-mix(in_srgb,var(--accent-ai)_30%,transparent)]",
                )}
                aria-label={
                  isAiSidebarOpen
                    ? "Close AI assistant"
                    : "Open AI assistant"
                }
                aria-expanded={isAiSidebarOpen}
                aria-controls="ai-sidebar"
                onClick={onAiSidebarToggle}
              >
                <Sparkles
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 ease-out group-hover/ai:rotate-12 group-hover/ai:scale-110"
                />
                <span className="transition-[letter-spacing] duration-300 group-hover/ai:tracking-wide">
                  AI
                </span>
              </Button>
            )}
          </>
        )}
        <div className="ml-0.5 flex h-8 items-center border-l border-surface-border pl-2">
          <UserButton
            appearance={{
              elements: {
                userButtonTrigger:
                  "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                avatarBox:
                  "size-7 rounded-lg ring-1 ring-surface-border-subtle",
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}
