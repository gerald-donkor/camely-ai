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

export const DEFAULT_NODE_COLOR = "#1F1F1F"
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
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">
export type CanvasEdge = Edge<Record<string, never>, "canvasEdge">
