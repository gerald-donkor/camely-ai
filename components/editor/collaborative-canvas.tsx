"use client"

import {
  Component,
  type DragEvent,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react"
import { ClientSideSuspense } from "@liveblocks/react"
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  addEdge,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Connection,
  type DefaultEdgeOptions,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import {
  CanvasEdgeActionsProvider,
  CanvasEdgeRenderer,
} from "@/components/editor/canvas-edge"
import {
  CanvasNodeActionsProvider,
  CanvasNodeRenderer,
} from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  NODE_SHAPES,
  SHAPE_DRAG_MIME_TYPE,
  type CanvasEdge,
  type CanvasNode,
  type NodeColorPair,
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

const edgeTypes = {
  canvasEdge: CanvasEdgeRenderer,
}

const defaultEdgeOptions = {
  interactionWidth: 24,
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
  type: "canvasEdge",
} satisfies DefaultEdgeOptions

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
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
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
          textColor: DEFAULT_NODE_TEXT_COLOR,
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

  const updateNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      const node = nodes.find(({ id }) => id === nodeId)

      if (!node || node.data.label === label) {
        return
      }

      onNodesChange([
        {
          id: nodeId,
          item: {
            ...node,
            data: {
              ...node.data,
              label,
            },
          },
          type: "replace",
        },
      ])
    },
    [nodes, onNodesChange],
  )

  const updateNodeColors = useCallback(
    (
      nodeId: string,
      { color, textColor }: Pick<NodeColorPair, "color" | "textColor">,
    ) => {
      const node = nodes.find(({ id }) => id === nodeId)

      if (
        !node ||
        (node.data.color === color && node.data.textColor === textColor)
      ) {
        return
      }

      onNodesChange([
        {
          id: nodeId,
          item: {
            ...node,
            data: {
              ...node.data,
              color,
              textColor,
            },
          },
          type: "replace",
        },
      ])
    },
    [nodes, onNodesChange],
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = addEdge<CanvasEdge>(connection, edges)

      if (nextEdges.length === edges.length) {
        return
      }

      const addedEdge = nextEdges.at(-1)

      if (!addedEdge) {
        return
      }

      onEdgesChange([
        {
          item: {
            ...addedEdge,
            data: { label: "" },
            interactionWidth: defaultEdgeOptions.interactionWidth,
            markerEnd: defaultEdgeOptions.markerEnd,
            type: "canvasEdge",
          },
          type: "add",
        },
      ])
    },
    [edges, onEdgesChange],
  )

  const updateEdgeLabel = useCallback(
    (edgeId: string, label: string) => {
      const edge = edges.find(({ id }) => id === edgeId)

      if (!edge || edge.data?.label === label) {
        return
      }

      onEdgesChange([
        {
          id: edgeId,
          item: {
            ...edge,
            data: {
              ...edge.data,
              label,
            },
          },
          type: "replace",
        },
      ])
    },
    [edges, onEdgesChange],
  )

  const finishEdgeEditing = useCallback((edgeId: string) => {
    setEditingEdgeId((currentEdgeId) =>
      currentEdgeId === edgeId ? null : currentEdgeId,
    )
  }, [])

  return (
    <div
      className="relative size-full bg-base"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CanvasNodeActionsProvider
        updateColors={updateNodeColors}
        updateLabel={updateNodeLabel}
      >
        <CanvasEdgeActionsProvider
          editingEdgeId={editingEdgeId}
          finishEditing={finishEdgeEditing}
          updateLabel={updateEdgeLabel}
        >
          <ReactFlow
            connectionLineStyle={{
              stroke: "var(--text-secondary)",
              strokeWidth: 1.5,
            }}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={defaultEdgeOptions}
            edges={edges}
            edgeTypes={edgeTypes}
            fitView
            nodes={nodes}
            nodeTypes={nodeTypes}
            className="bg-base"
            onConnect={handleConnect}
            onDelete={onDelete}
            onEdgeDoubleClick={(event, edge) => {
              event.stopPropagation()
              setEditingEdgeId(edge.id)
            }}
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
        </CanvasEdgeActionsProvider>
      </CanvasNodeActionsProvider>
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
