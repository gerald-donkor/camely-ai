import { AbortTaskRunError, logger, schemaTask } from "@trigger.dev/sdk"
import { LiveList, Liveblocks } from "@liveblocks/node"
import { mutateFlow, type MutableFlow } from "@liveblocks/react-flow/node"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateText, jsonSchema, tool } from "ai"

import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
  type NodeColorPair,
} from "../../types/canvas"
import {
  AI_AGENT_COLOR,
  AI_AGENT_NAME,
  AI_AGENT_USER_ID,
  AI_STATUS_FEED_KEY,
  type AiDesignStatusLevel,
  type AiDesignStatusMessage,
  type AiDesignStatusPhase,
} from "../../types/ai-design"

const DESIGN_ACTION_TYPES = [
  "addNode",
  "moveNode",
  "resizeNode",
  "updateNodeData",
  "deleteNode",
  "addEdge",
  "deleteEdge",
] as const

const HANDLE_IDS = ["top", "right", "bottom", "left"] as const
const MAX_STATUS_MESSAGES = 24
const DEFAULT_NODE_WIDTH = 176
const DEFAULT_NODE_HEIGHT = 76
const MIN_NODE_WIDTH = 88
const MIN_NODE_HEIGHT = 48
const MAX_NODE_WIDTH = 360
const MAX_NODE_HEIGHT = 220
const MIN_X_SPACING = 180
const MIN_Y_SPACING = 120
const DEFAULT_MODEL_ID = "google/gemini-2.5-flash"

type DesignActionType = (typeof DESIGN_ACTION_TYPES)[number]
type HandleId = (typeof HANDLE_IDS)[number]

interface DesignAgentPayload {
  prompt: string
  roomId: string
}

interface PlannedDesignAction {
  colorName?: string
  edgeId?: string
  height?: number
  label?: string
  nodeId?: string
  shape?: string
  source?: string
  sourceHandle?: string
  target?: string
  targetHandle?: string
  type: DesignActionType
  width?: number
  x?: number
  y?: number
}

interface DesignPlan {
  actions: PlannedDesignAction[]
  summary: string
}

interface CanvasSnapshot {
  edges: CanvasEdge[]
  nodes: CanvasNode[]
}

interface OccupiedNodeBounds {
  height: number
  width: number
  x: number
  y: number
}

interface StatusOptions {
  actionCount?: number
  level?: AiDesignStatusLevel
  message: string
  phase: AiDesignStatusPhase
  roomId: string
  runId: string
}

interface AddNodeToolInput {
  colorName?: string
  height?: number
  label?: string
  nodeId?: string
  shape?: string
  width?: number
  x?: number
  y?: number
}

interface MoveNodeToolInput {
  nodeId?: string
  x?: number
  y?: number
}

interface ResizeNodeToolInput {
  height?: number
  nodeId?: string
  width?: number
}

interface UpdateNodeDataToolInput {
  colorName?: string
  label?: string
  nodeId?: string
  shape?: string
}

interface DeleteNodeToolInput {
  nodeId?: string
}

interface AddEdgeToolInput {
  edgeId?: string
  label?: string
  source?: string
  sourceHandle?: string
  target?: string
  targetHandle?: string
}

interface DeleteEdgeToolInput {
  edgeId?: string
}

const nodeVisualProperties = {
  colorName: { type: "string" },
  height: { type: "number" },
  label: { type: "string" },
  shape: { type: "string" },
  width: { type: "number" },
} as const

const nodeIdentityProperty = {
  nodeId: { type: "string" },
} as const

const positionProperties = {
  x: { type: "number" },
  y: { type: "number" },
} as const

const edgeProperties = {
  edgeId: { type: "string" },
  label: { type: "string" },
  source: { type: "string" },
  sourceHandle: { type: "string" },
  target: { type: "string" },
  targetHandle: { type: "string" },
} as const

const designActionTools = {
  addEdge: tool({
    description: "Add a directed edge between two nodes.",
    inputSchema: jsonSchema<AddEdgeToolInput>({
      properties: edgeProperties,
      type: "object",
    }),
  }),
  addNode: tool({
    description: "Add a node to the architecture canvas.",
    inputSchema: jsonSchema<AddNodeToolInput>({
      properties: {
        ...nodeIdentityProperty,
        ...nodeVisualProperties,
        ...positionProperties,
      },
      type: "object",
    }),
  }),
  deleteEdge: tool({
    description: "Delete an existing edge.",
    inputSchema: jsonSchema<DeleteEdgeToolInput>({
      properties: {
        edgeId: { type: "string" },
      },
      type: "object",
    }),
  }),
  deleteNode: tool({
    description: "Delete an existing node.",
    inputSchema: jsonSchema<DeleteNodeToolInput>({
      properties: nodeIdentityProperty,
      type: "object",
    }),
  }),
  moveNode: tool({
    description: "Move an existing node.",
    inputSchema: jsonSchema<MoveNodeToolInput>({
      properties: {
        ...nodeIdentityProperty,
        ...positionProperties,
      },
      type: "object",
    }),
  }),
  resizeNode: tool({
    description: "Resize an existing node.",
    inputSchema: jsonSchema<ResizeNodeToolInput>({
      properties: {
        ...nodeIdentityProperty,
        height: { type: "number" },
        width: { type: "number" },
      },
      type: "object",
    }),
  }),
  updateNodeData: tool({
    description: "Update a node label, shape, or color.",
    inputSchema: jsonSchema<UpdateNodeDataToolInput>({
      properties: {
        ...nodeIdentityProperty,
        colorName: { type: "string" },
        label: { type: "string" },
        shape: { type: "string" },
      },
      type: "object",
    }),
  }),
} as const

const globalForDesignAgent = globalThis as unknown as {
  designAgentLiveblocks?: Liveblocks
}

function parseDesignAgentPayload(data: unknown): DesignAgentPayload {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Design agent payload must be an object")
  }

  const payload = data as Record<string, unknown>
  const prompt =
    typeof payload.prompt === "string" ? payload.prompt.trim() : ""
  const roomId =
    typeof payload.roomId === "string" ? payload.roomId.trim() : ""

  if (!prompt) {
    throw new Error("Prompt must be a non-empty string")
  }

  if (!roomId) {
    throw new Error("Room ID must be a non-empty string")
  }

  return { prompt, roomId }
}

function getLiveblocksClient() {
  if (globalForDesignAgent.designAgentLiveblocks) {
    return globalForDesignAgent.designAgentLiveblocks
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY?.trim()

  if (!secret) {
    throw new AbortTaskRunError("LIVEBLOCKS_SECRET_KEY is not configured")
  }

  globalForDesignAgent.designAgentLiveblocks = new Liveblocks({ secret })

  return globalForDesignAgent.designAgentLiveblocks
}

function getOpenRouterModel() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()

  if (!apiKey) {
    throw new AbortTaskRunError("OPENROUTER_API_KEY is not configured")
  }

  const openrouter = createOpenRouter({
    apiKey,
    appName: "Camely AI",
  })
  const modelId = process.env.OPENROUTER_DESIGN_MODEL?.trim() || DEFAULT_MODEL_ID

  return openrouter.chat(modelId, {
    parallelToolCalls: true,
    usage: { include: true },
  })
}

function safeRunId(runId: string) {
  return slugify(runId).slice(0, 32) || "run"
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function trimLabel(value: string | undefined, fallback: string) {
  const label = value?.trim()

  if (!label) {
    return fallback
  }

  return label.length > 80 ? label.slice(0, 80).trimEnd() : label
}

function finiteNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getNodeDimensions(node: CanvasNode) {
  const width = finiteNumber(
    typeof node.style?.width === "number" ? node.style.width : undefined,
    DEFAULT_NODE_WIDTH,
  )
  const height = finiteNumber(
    typeof node.style?.height === "number" ? node.style.height : undefined,
    DEFAULT_NODE_HEIGHT,
  )

  return { height, width }
}

function normalizeColorName(colorName: string | undefined) {
  return colorName?.trim().toLowerCase()
}

function getNamedColorPair(colorName: string | undefined) {
  const normalizedColorName = normalizeColorName(colorName)

  if (!normalizedColorName) {
    return null
  }

  return (
    NODE_COLORS.find(
      ({ name }) => name.toLowerCase() === normalizedColorName,
    ) ?? null
  )
}

function getDefaultColorPair(): NodeColorPair {
  return {
    color: DEFAULT_NODE_COLOR,
    name: "Neutral",
    textColor: DEFAULT_NODE_TEXT_COLOR,
  }
}

function getColorPair(colorName: string | undefined) {
  return getNamedColorPair(colorName) ?? getDefaultColorPair()
}

function inferNodeColorName(
  label: string,
  shape: CanvasNodeShape,
): NodeColorPair["name"] {
  const normalizedLabel = label.toLowerCase()

  if (/\b(auth|identity|login|session|oauth|clerk)\b/.test(normalizedLabel)) {
    return "Purple"
  }

  if (/\b(queue|message|event|stream|bus|kafka|pubsub|worker)\b/.test(normalizedLabel)) {
    return "Orange"
  }

  if (/\b(cache|redis|memory)\b/.test(normalizedLabel)) {
    return "Teal"
  }

  if (/\b(database|db|data|sql|nosql|postgres|mysql|mongo|storage|bucket|blob)\b/.test(normalizedLabel)) {
    return "Teal"
  }

  if (
    shape === "circle" &&
    /\b(user|client|customer|browser|actor)\b/.test(normalizedLabel)
  ) {
    return "Pink"
  }

  if (/\b(error|alert|fail|risk)\b/.test(normalizedLabel)) {
    return "Red"
  }

  if (/\b(api|gateway|service|catalog|order|payment|product|backend|frontend|web|app)\b/.test(normalizedLabel)) {
    return "Blue"
  }

  if (shape === "cylinder") {
    return "Teal"
  }

  if (shape === "diamond") {
    return "Orange"
  }

  if (shape === "hexagon") {
    return "Purple"
  }

  return "Blue"
}

function getNodeColorPair(
  action: PlannedDesignAction,
  label: string,
  shape: CanvasNodeShape,
) {
  return (
    getNamedColorPair(action.colorName) ??
    getNamedColorPair(inferNodeColorName(label, shape)) ??
    getDefaultColorPair()
  )
}

function isCanvasNodeShape(shape: string | undefined): shape is CanvasNodeShape {
  return NODE_SHAPES.includes(shape as CanvasNodeShape)
}

function isHandleId(handle: string | undefined): handle is HandleId {
  return HANDLE_IDS.includes(handle as HandleId)
}

function getOccupiedBounds(nodes: readonly CanvasNode[]) {
  return nodes.map((node) => {
    const { height, width } = getNodeDimensions(node)

    return {
      height,
      width,
      x: node.position.x,
      y: node.position.y,
    }
  })
}

function overlaps(a: OccupiedNodeBounds, b: OccupiedNodeBounds) {
  return (
    a.x < b.x + b.width + MIN_X_SPACING / 2 &&
    a.x + a.width + MIN_X_SPACING / 2 > b.x &&
    a.y < b.y + b.height + MIN_Y_SPACING / 2 &&
    a.y + a.height + MIN_Y_SPACING / 2 > b.y
  )
}

function placeWithoutOverlap(
  position: { x: number; y: number },
  width: number,
  height: number,
  occupied: OccupiedNodeBounds[],
) {
  const next = { ...position }

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = { height, width, x: next.x, y: next.y }

    if (!occupied.some((bounds) => overlaps(candidate, bounds))) {
      occupied.push(candidate)
      return next
    }

    next.x += MIN_X_SPACING
    if ((attempt + 1) % 4 === 0) {
      next.x = position.x
      next.y += MIN_Y_SPACING
    }
  }

  occupied.push({ height, width, x: next.x, y: next.y })
  return next
}

function getFallbackPosition(
  nodes: readonly CanvasNode[],
  index: number,
) {
  if (nodes.length === 0) {
    return {
      x: index * MIN_X_SPACING,
      y: index % 2 === 0 ? 0 : MIN_Y_SPACING,
    }
  }

  const maxX = Math.max(
    ...nodes.map((node) => node.position.x + getNodeDimensions(node).width),
  )
  const minY = Math.min(...nodes.map((node) => node.position.y))

  return {
    x: maxX + MIN_X_SPACING,
    y: minY + (index % 3) * MIN_Y_SPACING,
  }
}

function formatCanvasSnapshot(snapshot: CanvasSnapshot) {
  const nodes = snapshot.nodes.map((node) => {
    const { height, width } = getNodeDimensions(node)

    return {
      height,
      id: node.id,
      label: node.data.label || "(empty)",
      shape: node.data.shape,
      width,
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
    }
  })

  const edges = snapshot.edges.map((edge) => ({
    id: edge.id,
    label: edge.data?.label || "",
    source: edge.source,
    target: edge.target,
  }))

  return JSON.stringify({ edges, nodes }, null, 2)
}

function formatPalette() {
  return NODE_COLORS.map(
    ({ color, name, textColor }) =>
      `${name}: background ${color}, text ${textColor}`,
  ).join("\n")
}

function buildDesignPrompt(payload: DesignAgentPayload, snapshot: CanvasSnapshot) {
  return [
    `User request: ${payload.prompt}`,
    "",
    "Current collaborative canvas:",
    formatCanvasSnapshot(snapshot),
    "",
    "Allowed node shapes:",
    NODE_SHAPES.join(", "),
    "",
    "Allowed color palette:",
    formatPalette(),
    "",
    "Create a practical architecture diagram by calling the available canvas action tools.",
    `Use these action types exactly: ${DESIGN_ACTION_TYPES.join(", ")}.`,
    "Call one tool for each canvas action. Prefer several addNode calls followed by addEdge calls.",
    "For existing nodes or edges, reference the exact IDs from the current canvas.",
    "For new nodes, nodeId may be a short semantic key. Reuse that same key in addEdge source/target actions.",
    "Prefer left-to-right layouts with at least 180px horizontal spacing and 120px vertical spacing.",
    "Use concise labels, allowed shapes, and exact colorName values from the palette names above.",
    "Use Blue for APIs and services, Purple for auth or identity, Teal for databases and caches, Orange for queues or events, and Pink for human/user actors.",
    "Always add at least one node unless the request is only about deleting or modifying existing canvas items.",
    "After choosing tools, include a one-sentence summary in plain text.",
  ].join("\n")
}

async function readCanvasSnapshot(client: Liveblocks, roomId: string) {
  const snapshot: CanvasSnapshot = { edges: [], nodes: [] }

  await mutateFlow<CanvasNode, CanvasEdge>(
    { client, roomId },
    (flow) => {
      snapshot.nodes = flow.nodes.map((node) => ({
        ...node,
        data: { ...node.data },
        position: { ...node.position },
        style: node.style ? { ...node.style } : undefined,
      }))
      snapshot.edges = flow.edges.map((edge) => ({
        ...edge,
        data: edge.data ? { ...edge.data } : { label: "" },
        markerEnd:
          edge.markerEnd && typeof edge.markerEnd === "object"
            ? { ...edge.markerEnd }
            : edge.markerEnd,
        style: edge.style ? { ...edge.style } : undefined,
      }))
    },
  )

  return snapshot
}

async function createDesignPlan(
  payload: DesignAgentPayload,
  snapshot: CanvasSnapshot,
  abortSignal: AbortSignal,
) {
  const result = await generateText({
    abortSignal,
    instructions:
      "You are Camely AI, a systems architecture design agent. Translate the user's request into canvas action tool calls. Do not invent unsupported shapes, colors, handles, or action names.",
    maxOutputTokens: 3000,
    maxRetries: 1,
    model: getOpenRouterModel(),
    prompt: buildDesignPrompt(payload, snapshot),
    temperature: 0.2,
    toolChoice: "required",
    tools: designActionTools,
  })
  const actions = result.toolCalls
    .map((toolCall) => toolCallToAction(toolCall.toolName, toolCall.input))
    .filter((action): action is PlannedDesignAction => Boolean(action))

  if (actions.length === 0) {
    const fallbackPlan = parseFallbackPlan(result.text)

    if (fallbackPlan.actions.length > 0) {
      return fallbackPlan
    }

    throw new Error("The model did not produce any canvas actions.")
  }

  return {
    actions,
    summary:
      result.text.trim() ||
      `Generated ${actions.length} canvas action${
        actions.length === 1 ? "" : "s"
      }.`,
  }
}

function isDesignActionType(value: string): value is DesignActionType {
  return DESIGN_ACTION_TYPES.includes(value as DesignActionType)
}

function readObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
) {
  const value = record[key]

  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed ? trimmed : undefined
}

function readOptionalNumber(
  record: Record<string, unknown>,
  key: keyof PlannedDesignAction,
) {
  const value = record[key]

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined
}

function normalizePlannedAction(value: unknown): PlannedDesignAction | null {
  const record = readObject(value)

  if (!record) {
    return null
  }

  const type = readOptionalString(record, "type")

  if (!type || !isDesignActionType(type)) {
    return null
  }

  return {
    colorName: readOptionalString(record, "colorName"),
    edgeId: readOptionalString(record, "edgeId"),
    height: readOptionalNumber(record, "height"),
    label: readOptionalString(record, "label"),
    nodeId: readOptionalString(record, "nodeId"),
    shape: readOptionalString(record, "shape"),
    source: readOptionalString(record, "source"),
    sourceHandle: readOptionalString(record, "sourceHandle"),
    target: readOptionalString(record, "target"),
    targetHandle: readOptionalString(record, "targetHandle"),
    type,
    width: readOptionalNumber(record, "width"),
    x: readOptionalNumber(record, "x"),
    y: readOptionalNumber(record, "y"),
  } satisfies PlannedDesignAction
}

function toolCallToAction(
  toolName: string,
  input: unknown,
): PlannedDesignAction | null {
  if (!isDesignActionType(toolName)) {
    return null
  }

  return normalizePlannedAction({
    ...(readObject(input) ?? {}),
    type: toolName,
  })
}

function parseJsonObject(value: string) {
  const trimmed = value.trim()
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidates = [
    trimmed,
    fencedMatch?.[1]?.trim(),
    trimmed.includes("{") && trimmed.includes("}")
      ? trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1)
      : undefined,
  ].filter((candidate): candidate is string => Boolean(candidate))

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown
    } catch {
      // Try the next candidate.
    }
  }

  return null
}

function parseFallbackPlan(text: string): DesignPlan {
  const parsed = readObject(parseJsonObject(text))
  const actionsValue = parsed?.actions
  const actions = Array.isArray(actionsValue)
    ? actionsValue
        .map(normalizePlannedAction)
        .filter((action): action is PlannedDesignAction => Boolean(action))
    : []
  const summary = parsed ? readOptionalString(parsed, "summary") : undefined

  return {
    actions,
    summary: summary ?? "Generated a canvas architecture plan.",
  }
}

function resolveNodeId(
  actionNodeId: string | undefined,
  createdIds: Map<string, string>,
) {
  if (!actionNodeId) {
    return null
  }

  return createdIds.get(actionNodeId) ?? actionNodeId
}

function createNodeId(
  action: PlannedDesignAction,
  runSeed: string,
  index: number,
) {
  const base = slugify(action.nodeId ?? action.label ?? "node")

  return `ai-${base || "node"}-${runSeed}-${index}`
}

function createEdgeId(
  action: PlannedDesignAction,
  runSeed: string,
  index: number,
) {
  const explicit = slugify(action.edgeId ?? "")

  if (explicit) {
    return `ai-edge-${explicit}-${runSeed}-${index}`
  }

  const source = slugify(action.source ?? "source")
  const target = slugify(action.target ?? "target")

  return `ai-edge-${source}-${target}-${runSeed}-${index}`
}

function findDuplicateEdge(
  edges: readonly CanvasEdge[],
  source: string,
  target: string,
  sourceHandle: HandleId | undefined,
  targetHandle: HandleId | undefined,
) {
  return edges.find(
    (edge) =>
      edge.source === source &&
      edge.target === target &&
      (edge.sourceHandle ?? undefined) === sourceHandle &&
      (edge.targetHandle ?? undefined) === targetHandle,
  )
}

function applyAddNode(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: PlannedDesignAction,
  createdIds: Map<string, string>,
  occupied: OccupiedNodeBounds[],
  runSeed: string,
  index: number,
) {
  const width = clamp(
    finiteNumber(action.width, DEFAULT_NODE_WIDTH),
    MIN_NODE_WIDTH,
    MAX_NODE_WIDTH,
  )
  const height = clamp(
    finiteNumber(action.height, DEFAULT_NODE_HEIGHT),
    MIN_NODE_HEIGHT,
    MAX_NODE_HEIGHT,
  )
  const fallbackPosition = getFallbackPosition(flow.nodes, index)
  const position = placeWithoutOverlap(
    {
      x: Math.round(finiteNumber(action.x, fallbackPosition.x)),
      y: Math.round(finiteNumber(action.y, fallbackPosition.y)),
    },
    width,
    height,
    occupied,
  )
  const id = flow.getNode(action.nodeId ?? "")
    ? `${createNodeId(action, runSeed, index)}-copy`
    : createNodeId(action, runSeed, index)
  const shape = isCanvasNodeShape(action.shape) ? action.shape : "rectangle"
  const label = trimLabel(action.label, "New component")
  const colorPair = getNodeColorPair(action, label, shape)

  flow.addNode({
    data: {
      color: colorPair.color,
      label,
      shape,
      textColor: colorPair.textColor,
    },
    id,
    position,
    style: { height, width },
    type: "canvasNode",
  })

  if (action.nodeId) {
    createdIds.set(action.nodeId, id)
  }

  return 1
}

function applyMoveNode(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: PlannedDesignAction,
  createdIds: Map<string, string>,
  occupied: OccupiedNodeBounds[],
) {
  const nodeId = resolveNodeId(action.nodeId, createdIds)
  const node = nodeId ? flow.getNode(nodeId) : undefined

  if (!node) {
    return 0
  }

  const { height, width } = getNodeDimensions(node)
  const position = placeWithoutOverlap(
    {
      x: Math.round(finiteNumber(action.x, node.position.x)),
      y: Math.round(finiteNumber(action.y, node.position.y)),
    },
    width,
    height,
    occupied.filter((bounds) => bounds.x !== node.position.x || bounds.y !== node.position.y),
  )

  flow.updateNode(node.id, { position })

  return 1
}

function applyResizeNode(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: PlannedDesignAction,
  createdIds: Map<string, string>,
) {
  const nodeId = resolveNodeId(action.nodeId, createdIds)
  const node = nodeId ? flow.getNode(nodeId) : undefined

  if (!node) {
    return 0
  }

  const currentDimensions = getNodeDimensions(node)
  const width = clamp(
    finiteNumber(action.width, currentDimensions.width),
    MIN_NODE_WIDTH,
    MAX_NODE_WIDTH,
  )
  const height = clamp(
    finiteNumber(action.height, currentDimensions.height),
    MIN_NODE_HEIGHT,
    MAX_NODE_HEIGHT,
  )

  flow.updateNode(node.id, (currentNode) => ({
    ...currentNode,
    style: {
      ...currentNode.style,
      height,
      width,
    },
  }))

  return 1
}

function applyUpdateNodeData(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: PlannedDesignAction,
  createdIds: Map<string, string>,
) {
  const nodeId = resolveNodeId(action.nodeId, createdIds)
  const node = nodeId ? flow.getNode(nodeId) : undefined

  if (!node) {
    return 0
  }

  const patch: Partial<CanvasNode["data"]> = {}

  if (typeof action.label === "string" && action.label.trim()) {
    patch.label = trimLabel(action.label, node.data.label)
  }

  if (isCanvasNodeShape(action.shape)) {
    patch.shape = action.shape
  }

  if (action.colorName) {
    const colorPair = getColorPair(action.colorName)
    patch.color = colorPair.color
    patch.textColor = colorPair.textColor
  }

  if (Object.keys(patch).length === 0) {
    return 0
  }

  flow.updateNodeData(node.id, patch)

  return 1
}

function applyDeleteNode(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: PlannedDesignAction,
  createdIds: Map<string, string>,
) {
  const nodeId = resolveNodeId(action.nodeId, createdIds)

  if (!nodeId || !flow.getNode(nodeId)) {
    return 0
  }

  const connectedEdgeIds = flow.edges
    .filter((edge) => edge.source === nodeId || edge.target === nodeId)
    .map((edge) => edge.id)

  if (connectedEdgeIds.length > 0) {
    flow.removeEdges(connectedEdgeIds)
  }

  flow.removeNode(nodeId)

  return 1
}

function applyAddEdge(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: PlannedDesignAction,
  createdIds: Map<string, string>,
  runSeed: string,
  index: number,
) {
  const source = resolveNodeId(action.source, createdIds)
  const target = resolveNodeId(action.target, createdIds)

  if (!source || !target || source === target) {
    return 0
  }

  if (!flow.getNode(source) || !flow.getNode(target)) {
    return 0
  }

  const sourceHandle = isHandleId(action.sourceHandle)
    ? action.sourceHandle
    : undefined
  const targetHandle = isHandleId(action.targetHandle)
    ? action.targetHandle
    : undefined
  const existingEdge = findDuplicateEdge(
    flow.edges,
    source,
    target,
    sourceHandle,
    targetHandle,
  )

  if (existingEdge) {
    if (typeof action.label === "string") {
      flow.updateEdgeData(existingEdge.id, {
        label: trimLabel(action.label, existingEdge.data?.label ?? ""),
      })
      return 1
    }

    return 0
  }

  flow.addEdge({
    data: { label: trimLabel(action.label, "") },
    id: createEdgeId(action, runSeed, index),
    interactionWidth: 24,
    markerEnd: { type: "arrowclosed" },
    source,
    sourceHandle,
    target,
    targetHandle,
    type: "canvasEdge",
  })

  return 1
}

function applyDeleteEdge(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: PlannedDesignAction,
) {
  const edgeId = action.edgeId?.trim()

  if (!edgeId || !flow.getEdge(edgeId)) {
    return 0
  }

  flow.removeEdge(edgeId)

  return 1
}

function applyDesignPlan(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  plan: DesignPlan,
  runSeed: string,
) {
  const createdIds = new Map<string, string>()
  const occupied = getOccupiedBounds(flow.nodes)
  let appliedActions = 0

  plan.actions.forEach((action, index) => {
    switch (action.type) {
      case "addNode":
        appliedActions += applyAddNode(
          flow,
          action,
          createdIds,
          occupied,
          runSeed,
          index,
        )
        break
      case "moveNode":
        appliedActions += applyMoveNode(flow, action, createdIds, occupied)
        break
      case "resizeNode":
        appliedActions += applyResizeNode(flow, action, createdIds)
        break
      case "updateNodeData":
        appliedActions += applyUpdateNodeData(flow, action, createdIds)
        break
      case "deleteNode":
        appliedActions += applyDeleteNode(flow, action, createdIds)
        break
      case "addEdge":
        appliedActions += applyAddEdge(
          flow,
          action,
          createdIds,
          runSeed,
          index,
        )
        break
      case "deleteEdge":
        appliedActions += applyDeleteEdge(flow, action)
        break
    }
  })

  return appliedActions
}

async function applyDesignPlanToRoom(
  client: Liveblocks,
  roomId: string,
  plan: DesignPlan,
  runSeed: string,
) {
  let appliedActions = 0

  await mutateFlow<CanvasNode, CanvasEdge>(
    { client, roomId },
    (flow) => {
      appliedActions = applyDesignPlan(flow, plan, runSeed)
    },
  )

  return appliedActions
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Unknown design-agent failure"
}

function getPresenceCursor(snapshot: CanvasSnapshot, plan?: DesignPlan) {
  const firstPositionedAction = plan?.actions.find(
    (action) =>
      (action.type === "addNode" || action.type === "moveNode") &&
      typeof action.x === "number" &&
      Number.isFinite(action.x) &&
      typeof action.y === "number" &&
      Number.isFinite(action.y),
  )

  if (firstPositionedAction) {
    return {
      x: Math.round(firstPositionedAction.x ?? 0),
      y: Math.round(firstPositionedAction.y ?? 0),
    }
  }

  const firstNode = snapshot.nodes.at(0)

  if (firstNode) {
    return {
      x: Math.round(firstNode.position.x),
      y: Math.round(firstNode.position.y),
    }
  }

  return { x: 0, y: 0 }
}

async function updateAiPresence(
  client: Liveblocks,
  roomId: string,
  thinking: boolean,
  cursor: { x: number; y: number } | null,
  ttl = 60,
) {
  await client.setPresence(roomId, {
    data: { cursor, thinking },
    ttl,
    userId: AI_AGENT_USER_ID,
    userInfo: {
      avatar: "",
      color: AI_AGENT_COLOR,
      name: AI_AGENT_NAME,
    },
  })
}

async function publishStatus(client: Liveblocks, options: StatusOptions) {
  const status: AiDesignStatusMessage = {
    actionCount: options.actionCount,
    createdAt: new Date().toISOString(),
    id: `${options.runId}-${options.phase}-${Date.now()}`,
    level:
      options.level ??
      (options.phase === "complete"
        ? "success"
        : options.phase === "error"
          ? "error"
          : "info"),
    phase: options.phase,
    roomId: options.roomId,
    runId: options.runId,
    source: "design",
    text: options.message,
    type: "ai-status",
  }

  await client.mutateStorage(options.roomId, ({ root }) => {
    let feed = root.get(AI_STATUS_FEED_KEY)

    if (!feed) {
      feed = new LiveList<AiDesignStatusMessage>([])
      root.set(AI_STATUS_FEED_KEY, feed)
    }

    while (feed.length >= MAX_STATUS_MESSAGES) {
      feed.delete(0)
    }

    feed.push(status)
  })

  try {
    await client.broadcastEvent(options.roomId, status)
  } catch (error) {
    logger.warn("Unable to broadcast AI design status event", {
      error: getErrorMessage(error),
      roomId: options.roomId,
    })
  }

  return status
}

export const designAgent = schemaTask({
  id: "design-agent",
  schema: parseDesignAgentPayload,
  run: async (payload, { ctx, signal }) => {
    const client = getLiveblocksClient()
    const runId = ctx.run.id
    const runSeed = safeRunId(runId)
    let snapshot: CanvasSnapshot = { edges: [], nodes: [] }

    logger.info("Design agent task started", {
      prompt: payload.prompt,
      roomId: payload.roomId,
      runId,
    })

    try {
      await updateAiPresence(client, payload.roomId, true, { x: 0, y: 0 })
      await publishStatus(client, {
        message: "Camely AI is reading the request.",
        phase: "start",
        roomId: payload.roomId,
        runId,
      })

      await publishStatus(client, {
        message: "Inspecting the current canvas.",
        phase: "processing",
        roomId: payload.roomId,
        runId,
      })
      snapshot = await readCanvasSnapshot(client, payload.roomId)
      await updateAiPresence(
        client,
        payload.roomId,
        true,
        getPresenceCursor(snapshot),
      )

      await publishStatus(client, {
        message: "Planning the architecture changes with OpenRouter.",
        phase: "processing",
        roomId: payload.roomId,
        runId,
      })
      const plan = await createDesignPlan(payload, snapshot, signal)

      await updateAiPresence(
        client,
        payload.roomId,
        true,
        getPresenceCursor(snapshot, plan),
      )
      await publishStatus(client, {
        actionCount: plan.actions.length,
        message: `Applying ${plan.actions.length} planned canvas action${
          plan.actions.length === 1 ? "" : "s"
        }.`,
        phase: "processing",
        roomId: payload.roomId,
        runId,
      })

      const appliedActions = await applyDesignPlanToRoom(
        client,
        payload.roomId,
        plan,
        runSeed,
      )

      await publishStatus(client, {
        actionCount: appliedActions,
        level: "success",
        message: `Canvas updated. ${plan.summary}`,
        phase: "complete",
        roomId: payload.roomId,
        runId,
      })

      logger.info("Design agent task completed", {
        appliedActions,
        plannedActions: plan.actions.length,
        roomId: payload.roomId,
        runId,
      })

      return {
        actionCount: appliedActions,
        ok: true,
        roomId: payload.roomId,
        summary: plan.summary,
      }
    } catch (error) {
      logger.error("Design agent task failed", {
        error: getErrorMessage(error),
        roomId: payload.roomId,
        runId,
      })

      try {
        await publishStatus(client, {
          level: "error",
          message:
            "Design generation failed safely. The canvas was left available for editing.",
          phase: "error",
          roomId: payload.roomId,
          runId,
        })
      } catch (statusError) {
        logger.error("Unable to publish AI design error status", {
          error: getErrorMessage(statusError),
          roomId: payload.roomId,
          runId,
        })
      }

      throw error
    } finally {
      try {
        await updateAiPresence(client, payload.roomId, false, null, 2)
      } catch (presenceError) {
        logger.warn("Unable to clear AI design presence", {
          error: getErrorMessage(presenceError),
          roomId: payload.roomId,
          runId,
        })
      }
    }
  },
})
