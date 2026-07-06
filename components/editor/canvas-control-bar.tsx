"use client"

import {
  Maximize,
  Minus,
  Plus,
  Redo2,
  Undo2,
  type LucideIcon,
} from "lucide-react"

import {
  CANVAS_VIEWPORT_ANIMATION_DURATION,
  type CanvasViewportController,
} from "@/hooks/useKeyboardShortcuts"

interface CanvasControlBarProps {
  canRedo: boolean
  canUndo: boolean
  reactFlowInstance: CanvasViewportController | null
  redo: () => void
  undo: () => void
}

interface ControlButtonProps {
  disabled?: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}

function ControlButton({
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: ControlButtonProps) {
  return (
    <button
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-copy-muted"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  )
}

export function CanvasControlBar({
  canRedo,
  canUndo,
  reactFlowInstance,
  redo,
  undo,
}: CanvasControlBarProps) {
  const viewportOptions = {
    duration: CANVAS_VIEWPORT_ANIMATION_DURATION,
  }

  return (
    <div
      aria-label="Canvas controls"
      className="absolute bottom-5 left-5 z-20 flex items-center rounded-full border border-surface-border bg-elevated/95 p-1.5 shadow-2xl backdrop-blur-sm"
      role="toolbar"
    >
      <div aria-label="Zoom controls" className="flex items-center" role="group">
        <ControlButton
          disabled={!reactFlowInstance}
          icon={Minus}
          label="Zoom out"
          onClick={() => {
            void reactFlowInstance?.zoomOut(viewportOptions)
          }}
        />
        <ControlButton
          disabled={!reactFlowInstance}
          icon={Maximize}
          label="Fit view"
          onClick={() => {
            void reactFlowInstance?.fitView(viewportOptions)
          }}
        />
        <ControlButton
          disabled={!reactFlowInstance}
          icon={Plus}
          label="Zoom in"
          onClick={() => {
            void reactFlowInstance?.zoomIn(viewportOptions)
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="mx-1 h-5 w-px bg-surface-border"
      />

      <div
        aria-label="History controls"
        className="flex items-center"
        role="group"
      >
        <ControlButton
          disabled={!canUndo}
          icon={Undo2}
          label="Undo"
          onClick={undo}
        />
        <ControlButton
          disabled={!canRedo}
          icon={Redo2}
          label="Redo"
          onClick={redo}
        />
      </div>
    </div>
  )
}
