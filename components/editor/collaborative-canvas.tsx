"use client"

import {
  Component,
  type DragEvent,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useRef,
} from "react"
import { ClientSideSuspense } from "@liveblocks/react"
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { CanvasNodeRenderer } from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
import {
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  SHAPE_DRAG_MIME_TYPE,
  type CanvasEdge,
  type CanvasNode,
  type ShapeDragPayload,
} from "@/types/canvas"

interface CollaborativeCanvasProps {
  roomId: string
}

interface CanvasErrorBoundaryProps {
  children: ReactNode
}

interface CanvasErrorBoundaryState {
  hasError: boolean
}

const nodeTypes = {
  canvasNode: CanvasNodeRenderer,
}

function isShapeDragPayload(value: unknown): value is ShapeDragPayload {
  if (!value || typeof value !== "object") {
    return false
  }

  const payload = value as Record<string, unknown>

  return (
    typeof payload.shape === "string" &&
    NODE_SHAPES.includes(payload.shape as (typeof NODE_SHAPES)[number]) &&
    typeof payload.width === "number" &&
    Number.isFinite(payload.width) &&
    payload.width > 0 &&
    typeof payload.height === "number" &&
    Number.isFinite(payload.height) &&
    payload.height > 0
  )
}

function readShapeDragPayload(
  dataTransfer: DataTransfer,
): ShapeDragPayload | null {
  const serializedPayload =
    dataTransfer.getData(SHAPE_DRAG_MIME_TYPE) ||
    dataTransfer.getData("text/plain")

  if (!serializedPayload) {
    return null
  }

  try {
    const payload: unknown = JSON.parse(serializedPayload)
    return isShapeDragPayload(payload) ? payload : null
  } catch {
    return null
  }
}

class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Liveblocks canvas connection failed", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <CanvasStatus>
          The collaborative canvas could not connect. Refresh to try again.
        </CanvasStatus>
      )
    }

    return this.props.children
  }
}

function CanvasStatus({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-full items-center justify-center px-6 text-center text-sm text-copy-muted"
      role="status"
    >
      {children}
    </div>
  )
}

function LiveCanvas() {
  const reactFlowInstance = useRef<ReactFlowInstance<
    CanvasNode,
    CanvasEdge
  > | null>(null)
  const nodeCounter = useRef(0)
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: { initial: [] },
    edges: { initial: [] },
  })

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const payload = readShapeDragPayload(event.dataTransfer)
      const flow = reactFlowInstance.current

      if (!payload || !flow) {
        return
      }

      nodeCounter.current += 1

      const dropPosition = flow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      const node: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${nodeCounter.current}`,
        type: "canvasNode",
        position: {
          x: dropPosition.x - payload.width / 2,
          y: dropPosition.y - payload.height / 2,
        },
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
        style: {
          width: payload.width,
          height: payload.height,
        },
      }

      onNodesChange([{ type: "add", item: node }])
    },
    [onNodesChange],
  )

  return (
    <div
      className="relative size-full bg-base"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        connectionMode={ConnectionMode.Loose}
        edges={edges}
        fitView
        nodes={nodes}
        nodeTypes={nodeTypes}
        className="bg-base"
        onConnect={onConnect}
        onDelete={onDelete}
        onEdgesChange={onEdgesChange}
        onInit={(instance) => {
          reactFlowInstance.current = instance
        }}
        onNodesChange={onNodesChange}
      >
        <MiniMap
          bgColor="var(--bg-base)"
          className="rounded-xl border border-surface-border"
          maskColor="var(--bg-elevated)"
          nodeColor="var(--text-muted)"
          pannable
          zoomable
        />
        <Background
          color="var(--border-subtle)"
          gap={24}
          size={1}
          variant={BackgroundVariant.Dots}
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  )
}

export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <CanvasErrorBoundary>
          <ClientSideSuspense
            fallback={<CanvasStatus>Loading collaborative canvas…</CanvasStatus>}
          >
            <LiveCanvas />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
