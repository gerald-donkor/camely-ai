"use client"

import type { ComponentType, DragEvent, SVGProps } from "react"
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
} from "lucide-react"

import {
  SHAPE_DRAG_MIME_TYPE,
  type CanvasNodeShape,
  type ShapeDragPayload,
} from "@/types/canvas"

interface ShapeOption extends ShapeDragPayload {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
}

const SHAPE_OPTIONS: ShapeOption[] = [
  {
    shape: "rectangle",
    label: "Rectangle",
    icon: RectangleHorizontal,
    width: 160,
    height: 88,
  },
  {
    shape: "diamond",
    label: "Diamond",
    icon: Diamond,
    width: 168,
    height: 120,
  },
  {
    shape: "circle",
    label: "Circle",
    icon: Circle,
    width: 104,
    height: 104,
  },
  {
    shape: "pill",
    label: "Pill",
    icon: Pill,
    width: 152,
    height: 72,
  },
  {
    shape: "cylinder",
    label: "Cylinder",
    icon: Cylinder,
    width: 132,
    height: 104,
  },
  {
    shape: "hexagon",
    label: "Hexagon",
    icon: Hexagon,
    width: 144,
    height: 96,
  },
]

function handleDragStart(
  event: DragEvent<HTMLButtonElement>,
  shape: CanvasNodeShape,
  width: number,
  height: number,
) {
  const payload: ShapeDragPayload = { shape, width, height }

  event.dataTransfer.effectAllowed = "copy"
  event.dataTransfer.setData(SHAPE_DRAG_MIME_TYPE, JSON.stringify(payload))
  event.dataTransfer.setData("text/plain", JSON.stringify(payload))
}

export function ShapePanel() {
  return (
    <div
      aria-label="Canvas shapes"
      className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-elevated/95 p-1.5 shadow-2xl backdrop-blur-sm"
      role="toolbar"
    >
      {SHAPE_OPTIONS.map(({ shape, label, icon: Icon, width, height }) => (
        <button
          aria-label={`Drag ${label}`}
          className="flex size-10 cursor-grab items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
          draggable
          key={shape}
          onDragStart={(event) =>
            handleDragStart(event, shape, width, height)
          }
          title={label}
          type="button"
        >
          <Icon aria-hidden="true" className="size-5" />
        </button>
      ))}
    </div>
  )
}
