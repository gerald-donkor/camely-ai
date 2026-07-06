import {
  createContext,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react"

import { cn } from "@/lib/utils"
import type { CanvasEdge } from "@/types/canvas"

interface CanvasEdgeActionsContextValue {
  editingEdgeId: string | null
  finishEditing: (edgeId: string) => void
  updateLabel: (edgeId: string, label: string) => void
}

interface CanvasEdgeActionsProviderProps
  extends CanvasEdgeActionsContextValue {
  children: ReactNode
}

interface CanvasEdgeLabelEditorProps {
  initialLabel: string
  onSave: (label: string) => void
}

const CanvasEdgeActionsContext =
  createContext<CanvasEdgeActionsContextValue | null>(null)

export function CanvasEdgeActionsProvider({
  children,
  editingEdgeId,
  finishEditing,
  updateLabel,
}: CanvasEdgeActionsProviderProps) {
  return (
    <CanvasEdgeActionsContext
      value={{ editingEdgeId, finishEditing, updateLabel }}
    >
      {children}
    </CanvasEdgeActionsContext>
  )
}

function CanvasEdgeLabelEditor({
  initialLabel,
  onSave,
}: CanvasEdgeLabelEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draftLabel, setDraftLabel] = useState(initialLabel)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation()

    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  return (
    <input
      aria-label="Edge label"
      className="nodrag nopan nowheel h-7 max-w-56 rounded-xl border border-surface-border-subtle bg-elevated px-2 text-center text-xs text-copy-primary shadow-lg outline-none transition-colors placeholder:text-copy-faint focus:border-copy-muted"
      onBlur={() => onSave(draftLabel)}
      onChange={(event) => setDraftLabel(event.target.value)}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={handleEditorKeyDown}
      onPointerDown={(event) => event.stopPropagation()}
      placeholder="Add label"
      ref={inputRef}
      style={{
        width: `${Math.max(draftLabel.length, 9) + 2}ch`,
      }}
      value={draftLabel}
    />
  )
}

export function CanvasEdgeRenderer({
  data,
  id,
  interactionWidth,
  markerEnd,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  style,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<CanvasEdge>) {
  const edgeActions = useContext(CanvasEdgeActionsContext)
  const label = data?.label ?? ""
  const isEditing = edgeActions?.editingEdgeId === id
  const [isHovered, setIsHovered] = useState(false)
  const isActive = Boolean(selected || isHovered || isEditing)
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 6,
  })

  const saveLabel = (nextLabel: string) => {
    edgeActions?.updateLabel(id, nextLabel.trim())
    edgeActions?.finishEditing(id)
  }

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BaseEdge
          className="transition-[stroke,opacity] duration-150"
          interactionWidth={interactionWidth ?? 24}
          markerEnd={markerEnd}
          path={edgePath}
          style={{
            ...style,
            opacity: isActive ? 1 : 0.62,
            stroke: isActive
              ? "var(--text-primary)"
              : "var(--text-secondary)",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 1.5,
          }}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="absolute nodrag nopan nowheel"
          style={{
            pointerEvents: "all",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {isEditing ? (
            <CanvasEdgeLabelEditor
              initialLabel={label}
              onSave={saveLabel}
            />
          ) : label ? (
            <span
              className={cn(
                "block rounded-xl border bg-elevated/95 px-2 py-1 text-xs shadow-sm backdrop-blur-sm transition-colors",
                isActive
                  ? "border-surface-border-subtle text-copy-primary"
                  : "border-surface-border text-copy-secondary",
              )}
            >
              {label}
            </span>
          ) : isActive ? (
            <span className="block rounded-xl border border-dashed border-surface-border bg-elevated/80 px-2 py-1 text-xs text-copy-faint backdrop-blur-sm">
              Add label
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
