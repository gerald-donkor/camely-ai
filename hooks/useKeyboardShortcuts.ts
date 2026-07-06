"use client"

import { useEffect } from "react"

export const CANVAS_VIEWPORT_ANIMATION_DURATION = 200

interface ViewportAnimationOptions {
  duration?: number
}

export interface CanvasViewportController {
  fitView: (options?: ViewportAnimationOptions) => Promise<boolean>
  zoomIn: (options?: ViewportAnimationOptions) => Promise<boolean>
  zoomOut: (options?: ViewportAnimationOptions) => Promise<boolean>
}

interface UseKeyboardShortcutsOptions {
  reactFlowInstance: CanvasViewportController | null
  redo: () => void
  undo: () => void
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.matches("input, textarea") ||
    target.isContentEditable ||
    Boolean(
      target.closest(
        "[contenteditable]:not([contenteditable='false'])",
      ),
    )
  )
}

export function useKeyboardShortcuts({
  reactFlowInstance,
  redo,
  undo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return
      }

      const key = event.key.toLowerCase()
      const commandKeyPressed = event.metaKey || event.ctrlKey

      if (commandKeyPressed && !event.altKey && key === "z") {
        event.preventDefault()

        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }

        return
      }

      if (
        commandKeyPressed &&
        !event.altKey &&
        !event.shiftKey &&
        key === "y"
      ) {
        event.preventDefault()
        redo()
        return
      }

      if (
        !reactFlowInstance ||
        commandKeyPressed ||
        event.altKey
      ) {
        return
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        void reactFlowInstance.zoomIn({
          duration: CANVAS_VIEWPORT_ANIMATION_DURATION,
        })
      } else if (event.key === "-") {
        event.preventDefault()
        void reactFlowInstance.zoomOut({
          duration: CANVAS_VIEWPORT_ANIMATION_DURATION,
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [reactFlowInstance, redo, undo])
}
