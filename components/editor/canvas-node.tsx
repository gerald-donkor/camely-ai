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
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from "@xyflow/react"

import type { CanvasNode, CanvasNodeShape } from "@/types/canvas"
import { cn } from "@/lib/utils"

interface CanvasShapeProps {
  color: string
  selected?: boolean
  shape: CanvasNodeShape
}

interface CanvasNodeEditingContextValue {
  updateLabel: (nodeId: string, label: string) => void
}

interface CanvasNodeEditingProviderProps
  extends CanvasNodeEditingContextValue {
  children: ReactNode
}

const RESTING_BORDER = "var(--border-subtle)"
const SELECTED_BORDER = "var(--text-secondary)"
const MIN_NODE_WIDTH = 80
const MIN_NODE_HEIGHT = 48
const CanvasNodeEditingContext =
  createContext<CanvasNodeEditingContextValue | null>(null)

export function CanvasNodeEditingProvider({
  children,
  updateLabel,
}: CanvasNodeEditingProviderProps) {
  return (
    <CanvasNodeEditingContext value={{ updateLabel }}>
      {children}
    </CanvasNodeEditingContext>
  )
}

export function CanvasShape({
  color,
  selected = false,
  shape,
}: CanvasShapeProps) {
  const borderColor = selected ? SELECTED_BORDER : RESTING_BORDER

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    const borderRadius =
      shape === "rectangle" ? "var(--radius)" : "9999px"

    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 border-2 transition-colors"
        style={{
          backgroundColor: color,
          borderColor,
          borderRadius,
        }}
      />
    )
  }

  const svgShape = (() => {
    switch (shape) {
      case "diamond":
        return <polygon points="50,1 99,50 50,99 1,50" />
      case "cylinder":
        return (
          <>
            <path d="M1 18v64c0 9.4 21.9 17 49 17s49-7.6 49-17V18" />
            <ellipse cx="50" cy="18" rx="49" ry="17" />
            <path d="M1 82c0-9.4 21.9-17 49-17s49 7.6 49 17" />
          </>
        )
      case "hexagon":
        return <polygon points="25,1 75,1 99,50 75,99 25,99 1,50" />
    }
  })()

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 size-full overflow-visible"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <g
        fill={color}
        stroke={borderColor}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      >
        {svgShape}
      </g>
    </svg>
  )
}

export function CanvasNodeRenderer({
  data,
  id,
  isConnectable,
  selected,
}: NodeProps<CanvasNode>) {
  const editingContext = useContext(CanvasNodeEditingContext)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const handleClassName = cn(
    "!z-20 !size-2 !border !border-base !bg-copy-primary !transition-opacity after:absolute after:-inset-2 after:content-['']",
    selected ? "!opacity-100" : "!opacity-0 group-hover:!opacity-100",
  )

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const finishEditing = () => {
    setIsEditing(false)
  }

  const handleEditorKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    event.stopPropagation()

    if (event.key === "Escape") {
      finishEditing()
    }
  }

  return (
    <div className="group relative size-full text-copy-primary">
      <NodeResizer
        color="var(--text-muted)"
        handleClassName="!z-30 !size-2 !touch-none !rounded-full !border !border-base !bg-copy-muted after:absolute after:-inset-2 after:rounded-full after:bg-transparent after:content-['']"
        isVisible={selected && !isEditing}
        lineClassName="!z-20 !border-copy-faint before:absolute before:-inset-1.5 before:bg-transparent before:content-['']"
        minHeight={MIN_NODE_HEIGHT}
        minWidth={MIN_NODE_WIDTH}
      />
      <CanvasShape
        color={data.color}
        selected={selected}
        shape={data.shape}
      />
      <Handle
        className={handleClassName}
        id="top"
        isConnectable={isConnectable}
        position={Position.Top}
        type="source"
      />
      <Handle
        className={handleClassName}
        id="right"
        isConnectable={isConnectable}
        position={Position.Right}
        type="source"
      />
      <Handle
        className={handleClassName}
        id="bottom"
        isConnectable={isConnectable}
        position={Position.Bottom}
        type="source"
      />
      <Handle
        className={handleClassName}
        id="left"
        isConnectable={isConnectable}
        position={Position.Left}
        type="source"
      />
      {isEditing ? (
        <textarea
          aria-label="Node label"
          className="nodrag nopan nowheel absolute inset-0 z-20 size-full resize-none overflow-hidden border-0 bg-transparent px-4 text-center text-sm text-copy-primary outline-none placeholder:text-copy-faint"
          onBlur={finishEditing}
          onChange={(event) =>
            editingContext?.updateLabel(id, event.target.value)
          }
          onDoubleClick={(event) => event.stopPropagation()}
          onKeyDown={handleEditorKeyDown}
          onPointerDown={(event) => event.stopPropagation()}
          placeholder="Add label"
          ref={textareaRef}
          style={{ alignContent: "center" }}
          value={data.label}
        />
      ) : (
        <div
          className="relative z-10 flex size-full cursor-text items-center justify-center px-4 text-center text-sm"
          onDoubleClick={(event) => {
            event.stopPropagation()
            setIsEditing(true)
          }}
        >
          {data.label || (
            <span className="text-copy-faint">Add label</span>
          )}
        </div>
      )}
    </div>
  )
}
