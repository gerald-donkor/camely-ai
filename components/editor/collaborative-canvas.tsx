"use client"

import {
  Component,
  type DragEvent,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { ClientSideSuspense } from "@liveblocks/react"
import {
  LiveblocksProvider,
  RoomProvider,
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  addEdge,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  type Connection,
  type DefaultEdgeOptions,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import {
  CanvasEdgeActionsProvider,
  CanvasEdgeRenderer,
} from "@/components/editor/canvas-edge"
import { CanvasControlBar } from "@/components/editor/canvas-control-bar"
import {
  CanvasNodeActionsProvider,
  CanvasNodeRenderer,
} from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
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
  onTemplateImported?: () => void
  roomId: string
  templateToImport?: CanvasTemplate | null
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

interface LiveCanvasProps {
  onTemplateImported?: () => void
  templateToImport?: CanvasTemplate | null
}

function cloneTemplateNode(node: CanvasNode): CanvasNode {
  return {
    ...node,
    data: { ...node.data },
    position: { ...node.position },
    style: node.style ? { ...node.style } : undefined,
  }
}

function cloneTemplateEdge(edge: CanvasEdge): CanvasEdge {
  return {
    ...edge,
    data: edge.data ? { ...edge.data } : { label: "" },
    markerEnd:
      edge.markerEnd && typeof edge.markerEnd === "object"
        ? { ...edge.markerEnd }
        : edge.markerEnd,
    style: edge.style ? { ...edge.style } : undefined,
  }
}

function LiveCanvas({
  onTemplateImported,
  templateToImport,
}: LiveCanvasProps) {
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    CanvasNode,
    CanvasEdge
  > | null>(null)
  const nodeCounter = useRef(0)
  const importedTemplateRef = useRef<CanvasTemplate | null>(null)
  const pendingFitNodeIdsRef = useRef<Set<string> | null>(null)
  const canRedo = useCanRedo()
  const canUndo = useCanUndo()
  const redo = useRedo()
  const undo = useUndo()
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

  useKeyboardShortcuts({
    reactFlowInstance,
    redo,
    undo,
  })

  useEffect(() => {
    if (!templateToImport) {
      importedTemplateRef.current = null
      return
    }

    if (importedTemplateRef.current === templateToImport) {
      return
    }

    importedTemplateRef.current = templateToImport
    pendingFitNodeIdsRef.current = new Set(
      templateToImport.nodes.map(({ id }) => id),
    )
    setEditingEdgeId(null)

    const removeEdgeChanges: EdgeChange<CanvasEdge>[] = edges.map(
      ({ id }) => ({ id, type: "remove" }),
    )
    const removeNodeChanges: NodeChange<CanvasNode>[] = nodes.map(
      ({ id }) => ({ id, type: "remove" }),
    )
    const addNodeChanges: NodeChange<CanvasNode>[] =
      templateToImport.nodes.map((node) => ({
        item: cloneTemplateNode(node),
        type: "add",
      }))
    const addEdgeChanges: EdgeChange<CanvasEdge>[] =
      templateToImport.edges.map((edge) => ({
        item: cloneTemplateEdge(edge),
        type: "add",
      }))

    if (removeEdgeChanges.length > 0) {
      onEdgesChange(removeEdgeChanges)
    }
    if (removeNodeChanges.length > 0) {
      onNodesChange(removeNodeChanges)
    }
    if (addNodeChanges.length > 0) {
      onNodesChange(addNodeChanges)
    }
    if (addEdgeChanges.length > 0) {
      onEdgesChange(addEdgeChanges)
    }

    onTemplateImported?.()
  }, [
    edges,
    nodes,
    onEdgesChange,
    onNodesChange,
    onTemplateImported,
    templateToImport,
  ])

  useEffect(() => {
    const pendingNodeIds = pendingFitNodeIdsRef.current

    if (
      !reactFlowInstance ||
      !pendingNodeIds ||
      nodes.length !== pendingNodeIds.size ||
      !nodes.every(({ id }) => pendingNodeIds.has(id))
    ) {
      return
    }

    pendingFitNodeIdsRef.current = null
    window.requestAnimationFrame(() => {
      void reactFlowInstance.fitView({ duration: 350, padding: 0.18 })
    })
  }, [nodes, reactFlowInstance])

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const payload = readShapeDragPayload(event.dataTransfer)
      const flow = reactFlowInstance

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
    [onNodesChange, reactFlowInstance],
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
            onInit={setReactFlowInstance}
            onNodesChange={onNodesChange}
          >
            <Background
              color="var(--border-subtle)"
              gap={24}
              size={1}
              variant={BackgroundVariant.Dots}
            />
          </ReactFlow>
        </CanvasEdgeActionsProvider>
      </CanvasNodeActionsProvider>
      <CanvasControlBar
        canRedo={canRedo}
        canUndo={canUndo}
        reactFlowInstance={reactFlowInstance}
        redo={redo}
        undo={undo}
      />
      <ShapePanel />
    </div>
  )
}

export function CollaborativeCanvas({
  onTemplateImported,
  roomId,
  templateToImport,
}: CollaborativeCanvasProps) {
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
            <LiveCanvas
              onTemplateImported={onTemplateImported}
              templateToImport={templateToImport}
            />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
