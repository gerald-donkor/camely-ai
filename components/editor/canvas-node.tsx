"use client"

import {
  createContext,
  type CSSProperties,
  Fragment,
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
  NodeToolbar,
  Position,
  type NodeProps,
} from "@xyflow/react"

import {
  DEFAULT_NODE_TEXT_COLOR,
  NODE_COLORS,
  type CanvasNode,
  type CanvasNodeShape,
  type NodeColorPair,
} from "@/types/canvas"
import { cn } from "@/lib/utils"

interface CanvasShapeProps {
  color: string
  selected?: boolean
  shape: CanvasNodeShape
}

interface CanvasNodeActionsContextValue {
  updateColors: (
    nodeId: string,
    colorPair: Pick<NodeColorPair, "color" | "textColor">,
  ) => void
  updateLabel: (nodeId: string, label: string) => void
}

interface CanvasNodeActionsProviderProps
  extends CanvasNodeActionsContextValue {
  children: ReactNode
}

const RESTING_BORDER = "var(--border-subtle)"
const SELECTED_BORDER = "var(--text-secondary)"
const MIN_NODE_WIDTH = 80
const MIN_NODE_HEIGHT = 48
const CONNECTION_HANDLES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const
const CanvasNodeActionsContext =
  createContext<CanvasNodeActionsContextValue | null>(null)

export function CanvasNodeActionsProvider({
  children,
  updateColors,
  updateLabel,
}: CanvasNodeActionsProviderProps) {
  return (
    <CanvasNodeActionsContext value={{ updateColors, updateLabel }}>
      {children}
    </CanvasNodeActionsContext>
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
  const nodeActions = useContext(CanvasNodeActionsContext)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const activeColorPair =
    NODE_COLORS.find(({ color }) => color === data.color) ?? NODE_COLORS[0]
  const textColor =
    data.textColor ?? activeColorPair.textColor ?? DEFAULT_NODE_TEXT_COLOR
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
    <div className="group relative size-full" style={{ color: textColor }}>
      <NodeToolbar
        className="nodrag nopan nowheel flex items-center gap-1.5 rounded-xl border border-surface-border bg-elevated/95 p-1.5 shadow-xl backdrop-blur-sm"
        isVisible={selected}
        nodeId={id}
        offset={12}
        position={Position.Top}
      >
        {NODE_COLORS.map((colorPair) => {
          const isActive =
            data.color === colorPair.color &&
            textColor === colorPair.textColor

          return (
            <button
              aria-label={`Use ${colorPair.name} node colors`}
              aria-pressed={isActive}
              className={cn(
                "nodrag nopan size-6 touch-none rounded-full border transition-[box-shadow,transform] hover:shadow-[0_0_7px_var(--swatch-glow)]",
                isActive && "scale-110",
              )}
              key={colorPair.color}
              onClick={(event) => {
                if (event.detail === 0) {
                  nodeActions?.updateColors(id, colorPair)
                }
              }}
              onKeyDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => {
                event.stopPropagation()

                if (event.button === 0) {
                  event.preventDefault()
                  nodeActions?.updateColors(id, colorPair)
                }
              }}
              style={{
                "--swatch-glow": colorPair.textColor,
                backgroundColor: colorPair.color,
                borderColor: isActive
                  ? colorPair.textColor
                  : "var(--border-subtle)",
                boxShadow: isActive
                  ? `0 0 0 1px var(--bg-base), 0 0 0 2px ${colorPair.textColor}`
                  : undefined,
              } as CSSProperties}
              title={colorPair.name}
              type="button"
            />
          )
        })}
      </NodeToolbar>
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
      {CONNECTION_HANDLES.map(({ id: handleId, position }) => (
        <Fragment key={handleId}>
          <Handle
            className={handleClassName}
            id={handleId}
            isConnectable={isConnectable}
            position={position}
            type="source"
          />
          <Handle
            className={handleClassName}
            id={handleId}
            isConnectable={isConnectable}
            position={position}
            type="target"
          />
        </Fragment>
      ))}
      {isEditing ? (
        <textarea
          aria-label="Node label"
          className="nodrag nopan nowheel absolute inset-0 z-20 size-full resize-none overflow-hidden border-0 bg-transparent px-4 text-center text-sm text-current outline-none placeholder:text-current placeholder:opacity-40"
          onBlur={finishEditing}
          onChange={(event) =>
            nodeActions?.updateLabel(id, event.target.value)
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
          {data.label || <span className="opacity-40">Add label</span>}
        </div>
      )}
    </div>
  )
}
