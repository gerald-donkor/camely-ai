"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { CanvasSnapshot } from "@/types/canvas"

export type CanvasSaveStatus = "saving" | "saved" | "error"

interface UseCanvasAutosaveOptions extends CanvasSnapshot {
  enabled: boolean
  projectId: string
}

const AUTOSAVE_DELAY_MS = 1_000

export function useCanvasAutosave({
  edges,
  enabled,
  nodes,
  projectId,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("saved")
  const lastSavedJsonRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveQueueRef = useRef(Promise.resolve())
  const saveVersionRef = useRef(0)

  const persistSnapshot = useCallback((snapshot: CanvasSnapshot, force = false) => {
    const serializedSnapshot = JSON.stringify(snapshot)

    if (!force && serializedSnapshot === lastSavedJsonRef.current) {
      setStatus("saved")
      return
    }

    const saveVersion = saveVersionRef.current + 1
    saveVersionRef.current = saveVersion
    setStatus("saving")

    const saveOperation = saveQueueRef.current.then(async () => {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        body: serializedSnapshot,
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error(`Canvas save failed with status ${response.status}`)
      }
    })

    saveQueueRef.current = saveOperation.catch(() => undefined)

    void saveOperation.then(() => {
      lastSavedJsonRef.current = serializedSnapshot

      if (saveVersionRef.current === saveVersion) {
        setStatus("saved")
      }
    }).catch((error: unknown) => {
      console.error("Canvas autosave failed", error)

      if (saveVersionRef.current === saveVersion) {
        setStatus("error")
      }
    })
  }, [projectId])

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (enabled) {
      persistSnapshot({ edges, nodes }, true)
    }
  }, [edges, enabled, nodes, persistSnapshot])

  useEffect(() => {
    if (!enabled) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      persistSnapshot({ edges, nodes })
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [edges, enabled, nodes, persistSnapshot])

  return { saveNow, status }
}
