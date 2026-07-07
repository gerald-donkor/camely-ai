import {
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasSnapshot,
} from "@/types/canvas"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isCanvasNode(value: unknown): value is CanvasNode {
  if (!isRecord(value) || !isRecord(value.position) || !isRecord(value.data)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isFiniteNumber(value.position.x) &&
    isFiniteNumber(value.position.y) &&
    typeof value.data.label === "string" &&
    typeof value.data.color === "string" &&
    typeof value.data.shape === "string" &&
    NODE_SHAPES.includes(
      value.data.shape as (typeof NODE_SHAPES)[number],
    ) &&
    (value.data.textColor === undefined ||
      typeof value.data.textColor === "string")
  )
}

function isCanvasEdge(value: unknown): value is CanvasEdge {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.source === "string" &&
    value.source.length > 0 &&
    typeof value.target === "string" &&
    value.target.length > 0 &&
    (value.data === undefined ||
      (isRecord(value.data) &&
        (value.data.label === undefined ||
          typeof value.data.label === "string")))
  )
}

export function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return false
  }

  return value.nodes.every(isCanvasNode) && value.edges.every(isCanvasEdge)
}
