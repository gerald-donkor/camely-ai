import type { Edge, Node } from "@xyflow/react"

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

export type CanvasNodeShape = (typeof NODE_SHAPES)[number]

export interface NodeColorPair {
  color: string
  name: string
  textColor: string
}

export const NODE_COLORS = [
  { color: "#1F1F1F", name: "Neutral", textColor: "#EDEDED" },
  { color: "#10233D", name: "Blue", textColor: "#52A8FF" },
  { color: "#2E1938", name: "Purple", textColor: "#BF7AF0" },
  { color: "#331B00", name: "Orange", textColor: "#FF990A" },
  { color: "#3C1618", name: "Red", textColor: "#FF6166" },
  { color: "#3A1726", name: "Pink", textColor: "#F75F8F" },
  { color: "#0F2E18", name: "Green", textColor: "#62C073" },
  { color: "#062822", name: "Teal", textColor: "#0AC7B4" },
] as const satisfies readonly NodeColorPair[]

export const DEFAULT_NODE_COLOR = NODE_COLORS[0].color
export const DEFAULT_NODE_TEXT_COLOR = NODE_COLORS[0].textColor
export const SHAPE_DRAG_MIME_TYPE = "application/x-camely-shape"

export interface ShapeDragPayload {
  height: number
  shape: CanvasNodeShape
  width: number
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color: string
  shape: CanvasNodeShape
  textColor?: string
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">
export type CanvasEdge = Edge<Record<string, never>, "canvasEdge">
