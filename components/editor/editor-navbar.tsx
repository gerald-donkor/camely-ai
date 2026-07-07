"use client"

import { useEffect, useRef, useState } from "react"
import { UserButton } from "@clerk/nextjs"
import {
  Check,
  LayoutTemplate,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Share2,
  Sparkles,
  TriangleAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"
import { cn } from "@/lib/utils"

type SaveButtonFeedback = "idle" | "saving" | "saved" | "error"

interface EditorNavbarProps {
  isAiSidebarOpen?: boolean
  isSidebarOpen: boolean
  projectName?: string
  saveStatus?: CanvasSaveStatus
  showUserButton?: boolean
  onAiSidebarToggle?: () => void
  onSave?: () => void
  onShare?: () => void
  onSidebarToggle: () => void
  onStarterTemplates?: () => void
}

const SAVE_FEEDBACK_DURATION_MS = 1_200

export function EditorNavbar({
  isAiSidebarOpen = false,
  isSidebarOpen,
  projectName,
  saveStatus = "saved",
  showUserButton = true,
  onAiSidebarToggle,
  onSave,
  onShare,
  onSidebarToggle,
  onStarterTemplates,
}: EditorNavbarProps) {
  const [saveFeedback, setSaveFeedback] =
    useState<SaveButtonFeedback>("idle")
  const previousSaveStatusRef = useRef<CanvasSaveStatus>(saveStatus)
  const saveFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen
  const toggleLabel = isSidebarOpen
    ? "Close project sidebar"
    : "Open project sidebar"

  useEffect(() => {
    if (!onSave) {
      return
    }

    if (saveFeedbackTimeoutRef.current) {
      clearTimeout(saveFeedbackTimeoutRef.current)
      saveFeedbackTimeoutRef.current = null
    }

    const previousSaveStatus = previousSaveStatusRef.current
    const showFeedback = (
      nextFeedback: SaveButtonFeedback,
      resetAfterDelay = false,
    ) => {
      saveFeedbackTimeoutRef.current = setTimeout(() => {
        setSaveFeedback(nextFeedback)

        if (resetAfterDelay) {
          saveFeedbackTimeoutRef.current = setTimeout(() => {
            setSaveFeedback("idle")
            saveFeedbackTimeoutRef.current = null
          }, SAVE_FEEDBACK_DURATION_MS)
        } else {
          saveFeedbackTimeoutRef.current = null
        }
      }, 0)
    }

    if (saveStatus === "saving") {
      showFeedback("saving")
    } else if (saveStatus === "error") {
      showFeedback("error", true)
    } else if (previousSaveStatus === "saving") {
      showFeedback("saved", true)
    } else {
      showFeedback("idle")
    }

    previousSaveStatusRef.current = saveStatus
  }, [onSave, saveStatus])

  useEffect(() => {
    return () => {
      if (saveFeedbackTimeoutRef.current) {
        clearTimeout(saveFeedbackTimeoutRef.current)
      }
    }
  }, [])

  const saveLabel =
    saveFeedback === "saving"
      ? "Saving..."
      : saveFeedback === "saved"
        ? "Saved"
        : saveFeedback === "error"
          ? "Error"
          : "Save"
  const SaveStatusIcon =
    saveFeedback === "saving"
      ? LoaderCircle
      : saveFeedback === "error"
        ? TriangleAlert
        : saveFeedback === "saved"
          ? Check
          : null

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
            {onSave && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                className={cn(
                  "h-8 rounded-lg px-3 text-copy-secondary hover:bg-subtle hover:text-copy-primary",
                  saveFeedback === "error" &&
                    "text-destructive hover:text-destructive",
                )}
                aria-label={
                  saveFeedback === "error"
                    ? "Retry saving canvas"
                    : "Save canvas"
                }
                onClick={onSave}
              >
                <Save aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">{saveLabel}</span>
                {SaveStatusIcon && (
                  <SaveStatusIcon
                    aria-hidden="true"
                    className={cn(
                      "size-3.5",
                      saveFeedback === "saving" && "animate-spin",
                    )}
                  />
                )}
              </Button>
            )}
            {onStarterTemplates && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                className="h-8 rounded-lg px-3 text-copy-secondary hover:bg-subtle hover:text-copy-primary"
                aria-label="Open starter templates"
                onClick={onStarterTemplates}
              >
                <LayoutTemplate aria-hidden="true" className="size-4" />
                <span className="hidden md:inline">Templates</span>
              </Button>
            )}
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
        {showUserButton && (
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
        )}
      </div>
    </header>
  )
}
