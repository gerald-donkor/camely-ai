"use client"

import {
  Component,
  type DragEvent,
  type ErrorInfo,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
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
import {
  Cursors,
  useLiveblocksFlow,
} from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  addEdge,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  SelectionMode,
  type Connection,
  type DefaultEdgeOptions,
  type EdgeChange,
  type NodeChange,
  type OnDelete,
  type ReactFlowInstance,
  useEdges,
  useNodes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-flow/styles.css"

import {
  CanvasEdgeActionsProvider,
  CanvasEdgeRenderer,
} from "@/components/editor/canvas-edge"
import { CanvasControlBar } from "@/components/editor/canvas-control-bar"
import {
  CanvasCursor,
  CanvasPresence,
} from "@/components/editor/canvas-presence"
import {
  CanvasNodeActionsProvider,
  CanvasNodeRenderer,
} from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import {
  type CanvasSaveStatus,
  useCanvasAutosave,
} from "@/hooks/use-canvas-autosave"
import { isCanvasSnapshot } from "@/lib/canvas-snapshot"
import { authenticateLiveblocks } from "@/lib/liveblocks-auth-client"
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
  isAiSidebarOpen?: boolean
  onTemplateImported?: () => void
  onSaveStatusChange?: (status: CanvasSaveStatus) => void
  roomId: string
  saveRequest?: number
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

const cursorComponents = {
  Cursor: CanvasCursor,
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
  isAiSidebarOpen?: boolean
  onTemplateImported?: () => void
  onSaveStatusChange?: (status: CanvasSaveStatus) => void
  projectId: string
  saveRequest?: number
  templateToImport?: CanvasTemplate | null
}

interface CanvasDeleteKeyHandlerProps {
  canvasWrapperRef: RefObject<HTMLDivElement | null>
  onDelete: OnDelete<CanvasNode, CanvasEdge>
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

function isEditableEventTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  )
}

function isInsideCanvasWrapper(
  canvasWrapper: HTMLDivElement,
  value: EventTarget | Element | null,
) {
  const view = canvasWrapper.ownerDocument.defaultView

  return Boolean(view && value instanceof view.Node && canvasWrapper.contains(value))
}

function isCanvasKeyboardEvent(
  canvasWrapper: HTMLDivElement,
  event: globalThis.KeyboardEvent,
) {
  const activeElement = canvasWrapper.ownerDocument.activeElement

  return (
    isInsideCanvasWrapper(canvasWrapper, event.target) ||
    isInsideCanvasWrapper(canvasWrapper, activeElement) ||
    activeElement === canvasWrapper.ownerDocument.body ||
    activeElement === canvasWrapper.ownerDocument.documentElement
  )
}

function CanvasDeleteKeyHandler({
  canvasWrapperRef,
  onDelete,
}: CanvasDeleteKeyHandlerProps) {
  const flowNodes = useNodes<CanvasNode>()
  const flowEdges = useEdges<CanvasEdge>()
  const flowNodesRef = useRef(flowNodes)
  const flowEdgesRef = useRef(flowEdges)

  useEffect(() => {
    flowNodesRef.current = flowNodes
    flowEdgesRef.current = flowEdges
  }, [flowEdges, flowNodes])

  useEffect(() => {
    const canvasWrapper = canvasWrapperRef.current

    if (!canvasWrapper) {
      return
    }

    const activeCanvasWrapper: HTMLDivElement = canvasWrapper

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (
        event.defaultPrevented ||
        (event.key !== "Delete" && event.key !== "Backspace") ||
        isEditableEventTarget(event.target) ||
        !isCanvasKeyboardEvent(activeCanvasWrapper, event)
      ) {
        return
      }

      const selectedNodes = flowNodesRef.current.filter((node) => node.selected)
      const selectedEdges = flowEdgesRef.current.filter((edge) => edge.selected)
      const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))

      if (selectedNodes.length === 0 && selectedEdges.length === 0) {
        return
      }

      const edgeIdsToRemove = new Set(selectedEdges.map((edge) => edge.id))

      for (const edge of flowEdgesRef.current) {
        if (
          selectedNodeIds.has(edge.source) ||
          selectedNodeIds.has(edge.target)
        ) {
          edgeIdsToRemove.add(edge.id)
        }
      }

      event.preventDefault()
      event.stopPropagation()

      onDelete({
        edges: flowEdgesRef.current.filter((edge) => edgeIdsToRemove.has(edge.id)),
        nodes: selectedNodes,
      })
    }

    activeCanvasWrapper.ownerDocument.addEventListener("keydown", handleKeyDown, {
      capture: true,
    })
    activeCanvasWrapper.addEventListener("keydown", handleKeyDown)

    return () => {
      activeCanvasWrapper.ownerDocument.removeEventListener(
        "keydown",
        handleKeyDown,
        { capture: true },
      )
      activeCanvasWrapper.removeEventListener("keydown", handleKeyDown)
    }
  }, [canvasWrapperRef, onDelete])

  return null
}

function LiveCanvas({
  isAiSidebarOpen,
  onTemplateImported,
  onSaveStatusChange,
  projectId,
  saveRequest = 0,
  templateToImport,
}: LiveCanvasProps) {
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
  const [isAreaSelectionArmed, setIsAreaSelectionArmed] = useState(false)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    CanvasNode,
    CanvasEdge
  > | null>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const nodeCounter = useRef(0)
  const importedTemplateRef = useRef<CanvasTemplate | null>(null)
  const pendingFitNodeIdsRef = useRef<Set<string> | null>(null)
  const pendingLoadRef = useRef<{
    edgeIds: Set<string>
    nodeIds: Set<string>
  } | null>(null)
  const lastSaveRequestRef = useRef(saveRequest)
  const nodesRef = useRef<CanvasNode[]>([])
  const edgesRef = useRef<CanvasEdge[]>([])
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [hasLoadError, setHasLoadError] = useState(false)
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
  const { saveNow, status: autosaveStatus } = useCanvasAutosave({
    edges,
    enabled: isCanvasReady && !hasLoadError,
    nodes,
    projectId,
  })

  useKeyboardShortcuts({
    reactFlowInstance,
    redo,
    undo,
  })

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [edges, nodes])

  useEffect(() => {
    onSaveStatusChange?.(hasLoadError ? "error" : autosaveStatus)
  }, [autosaveStatus, hasLoadError, onSaveStatusChange])

  useEffect(() => {
    if (lastSaveRequestRef.current === saveRequest) {
      return
    }

    lastSaveRequestRef.current = saveRequest
    saveNow()
  }, [saveNow, saveRequest])

  useEffect(() => {
    if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
      setIsCanvasReady(true)
      return
    }

    const controller = new AbortController()

    async function loadSavedCanvas() {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (response.status === 204) {
          setIsCanvasReady(true)
          return
        }

        if (!response.ok) {
          throw new Error(`Canvas load failed with status ${response.status}`)
        }

        const snapshot: unknown = await response.json()

        if (!isCanvasSnapshot(snapshot)) {
          throw new Error("Canvas load returned an invalid snapshot")
        }

        if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
          setIsCanvasReady(true)
          return
        }

        if (snapshot.nodes.length === 0 && snapshot.edges.length === 0) {
          setIsCanvasReady(true)
          return
        }

        pendingLoadRef.current = {
          edgeIds: new Set(snapshot.edges.map(({ id }) => id)),
          nodeIds: new Set(snapshot.nodes.map(({ id }) => id)),
        }
        pendingFitNodeIdsRef.current = new Set(
          snapshot.nodes.map(({ id }) => id),
        )

        if (snapshot.nodes.length > 0) {
          onNodesChange(
            snapshot.nodes.map((node) => ({
              item: node,
              type: "add" as const,
            })),
          )
        }
        if (snapshot.edges.length > 0) {
          onEdgesChange(
            snapshot.edges.map((edge) => ({
              item: edge,
              type: "add" as const,
            })),
          )
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error("Saved canvas load failed", error)
        setHasLoadError(true)
      }
    }

    void loadSavedCanvas()

    return () => controller.abort()
  }, [onEdgesChange, onNodesChange, projectId])

  useEffect(() => {
    const pendingLoad = pendingLoadRef.current

    if (
      !pendingLoad ||
      ![...pendingLoad.nodeIds].every((id) =>
        nodes.some((node) => node.id === id),
      ) ||
      ![...pendingLoad.edgeIds].every((id) =>
        edges.some((edge) => edge.id === id),
      )
    ) {
      return
    }

    pendingLoadRef.current = null
    setIsCanvasReady(true)
  }, [edges, nodes])

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

  const handlePaneClick = useCallback(
    (event: ReactMouseEvent) => {
      if (event.detail >= 2) {
        setIsAreaSelectionArmed(true)
        return
      }

      if (isAreaSelectionArmed) {
        setIsAreaSelectionArmed(false)
      }
    },
    [isAreaSelectionArmed],
  )

  const disarmAreaSelection = useCallback(() => {
    setIsAreaSelectionArmed(false)
  }, [])

  return (
    <div
      className="relative size-full bg-base"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPointerDown={(event) => {
        if (!isEditableEventTarget(event.target)) {
          event.currentTarget.focus()
        }
      }}
      ref={canvasWrapperRef}
      tabIndex={-1}
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
            deleteKeyCode={null}
            edges={edges}
            edgeTypes={edgeTypes}
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
            onPaneClick={handlePaneClick}
            onSelectionEnd={disarmAreaSelection}
            panOnDrag={isAreaSelectionArmed ? [1, 2] : true}
            selectionMode={SelectionMode.Partial}
            selectionOnDrag={isAreaSelectionArmed}
            zoomOnDoubleClick={false}
          >
            <CanvasDeleteKeyHandler
              canvasWrapperRef={canvasWrapperRef}
              onDelete={onDelete}
            />
            <Background
              color="var(--border-subtle)"
              gap={24}
              size={1}
              variant={BackgroundVariant.Dots}
            />
            <Cursors
              className="z-30"
              components={cursorComponents}
              style={{ zIndex: 30 }}
            />
          </ReactFlow>
        </CanvasEdgeActionsProvider>
      </CanvasNodeActionsProvider>
      <CanvasPresence isAiSidebarOpen={isAiSidebarOpen} />
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
  isAiSidebarOpen,
  onTemplateImported,
  onSaveStatusChange,
  roomId,
  saveRequest,
  templateToImport,
}: CollaborativeCanvasProps) {
  return (
    <LiveblocksProvider
      authEndpoint={authenticateLiveblocks}
      preventUnsavedChanges
    >
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <CanvasErrorBoundary>
          <ClientSideSuspense
            fallback={<CanvasStatus>Loading collaborative canvas…</CanvasStatus>}
          >
            <LiveCanvas
              isAiSidebarOpen={isAiSidebarOpen}
              onTemplateImported={onTemplateImported}
              onSaveStatusChange={onSaveStatusChange}
              projectId={roomId}
              saveRequest={saveRequest}
              templateToImport={templateToImport}
            />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
