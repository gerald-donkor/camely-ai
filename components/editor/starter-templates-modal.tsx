"use client"

import { Download } from "lucide-react"

import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CanvasNode } from "@/types/canvas"

interface StarterTemplatesModalProps {
  isOpen: boolean
  onImport: (template: CanvasTemplate) => void
  onOpenChange: (open: boolean) => void
}

interface PreviewNode {
  centerX: number
  centerY: number
  height: number
  node: CanvasNode
  width: number
  x: number
  y: number
}

const PREVIEW_WIDTH = 320
const PREVIEW_HEIGHT = 160
const PREVIEW_PADDING = 14

function numericDimension(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsedValue = Number.parseFloat(value)
    return Number.isFinite(parsedValue) ? parsedValue : fallback
  }

  return fallback
}

function getPreviewNodes(template: CanvasTemplate): PreviewNode[] {
  if (template.nodes.length === 0) {
    return []
  }

  const measuredNodes = template.nodes.map((node) => {
    const width = numericDimension(node.style?.width, 152)
    const height = numericDimension(node.style?.height, 72)

    return {
      node,
      width,
      height,
      x: node.position.x,
      y: node.position.y,
    }
  })
  const minX = Math.min(...measuredNodes.map(({ x }) => x))
  const minY = Math.min(...measuredNodes.map(({ y }) => y))
  const maxX = Math.max(
    ...measuredNodes.map(({ width, x }) => x + width),
  )
  const maxY = Math.max(
    ...measuredNodes.map(({ height, y }) => y + height),
  )
  const contentWidth = Math.max(maxX - minX, 1)
  const contentHeight = Math.max(maxY - minY, 1)
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / contentWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / contentHeight,
  )
  const offsetX = (PREVIEW_WIDTH - contentWidth * scale) / 2
  const offsetY = (PREVIEW_HEIGHT - contentHeight * scale) / 2

  return measuredNodes.map(({ node, width, height, x, y }) => {
    const previewX = offsetX + (x - minX) * scale
    const previewY = offsetY + (y - minY) * scale
    const previewWidth = width * scale
    const previewHeight = height * scale

    return {
      node,
      x: previewX,
      y: previewY,
      width: previewWidth,
      height: previewHeight,
      centerX: previewX + previewWidth / 2,
      centerY: previewY + previewHeight / 2,
    }
  })
}

function PreviewNodeShape({
  height,
  node,
  width,
  x,
  y,
}: PreviewNode) {
  const commonProps = {
    fill: node.data.color,
    stroke: "var(--border-subtle)",
    strokeWidth: 0.75,
  }

  switch (node.data.shape) {
    case "circle":
      return (
        <ellipse
          {...commonProps}
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
        />
      )
    case "diamond":
      return (
        <polygon
          {...commonProps}
          points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`}
        />
      )
    case "hexagon":
      return (
        <polygon
          {...commonProps}
          points={`${x + width * 0.25},${y} ${x + width * 0.75},${y} ${x + width},${y + height / 2} ${x + width * 0.75},${y + height} ${x + width * 0.25},${y + height} ${x},${y + height / 2}`}
        />
      )
    case "cylinder": {
      const capHeight = Math.min(height * 0.22, 10)

      return (
        <g {...commonProps}>
          <path
            d={`M ${x} ${y + capHeight} V ${y + height - capHeight} C ${x} ${y + height} ${x + width} ${y + height} ${x + width} ${y + height - capHeight} V ${y + capHeight}`}
          />
          <ellipse
            cx={x + width / 2}
            cy={y + capHeight}
            rx={width / 2}
            ry={capHeight}
          />
          <path
            d={`M ${x} ${y + height - capHeight} C ${x} ${y + height - capHeight * 2} ${x + width} ${y + height - capHeight * 2} ${x + width} ${y + height - capHeight}`}
            fill="none"
          />
        </g>
      )
    }
    case "pill":
      return (
        <rect
          {...commonProps}
          height={height}
          rx={height / 2}
          width={width}
          x={x}
          y={y}
        />
      )
    case "rectangle":
      return (
        <rect
          {...commonProps}
          height={height}
          rx={Math.min(6, height * 0.12)}
          width={width}
          x={x}
          y={y}
        />
      )
  }
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const previewNodes = getPreviewNodes(template)
  const previewNodesById = new Map(
    previewNodes.map((previewNode) => [previewNode.node.id, previewNode]),
  )

  return (
    <svg
      aria-hidden="true"
      className="h-44 w-full bg-base"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
    >
      <g stroke="var(--text-faint)" strokeLinecap="round" strokeWidth="1">
        {template.edges.map((edge) => {
          const source = previewNodesById.get(edge.source)
          const target = previewNodesById.get(edge.target)

          if (!source || !target) {
            return null
          }

          return (
            <line
              key={edge.id}
              x1={source.centerX}
              x2={target.centerX}
              y1={source.centerY}
              y2={target.centerY}
            />
          )
        })}
      </g>
      {previewNodes.map((previewNode) => (
        <PreviewNodeShape
          key={previewNode.node.id}
          {...previewNode}
        />
      ))}
    </svg>
  )
}

export function StarterTemplatesModal({
  isOpen,
  onImport,
  onOpenChange,
}: StarterTemplatesModalProps) {
  const importTemplate = (template: CanvasTemplate) => {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-3xl border border-surface-border bg-elevated p-0 text-copy-primary shadow-2xl ring-0 sm:max-w-[75rem] [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-surface-border [&_[data-slot=dialog-close]]:text-copy-muted">
        <DialogHeader className="gap-2 px-6 pb-5 pt-6 pr-16">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Import Template
          </DialogTitle>
          <DialogDescription className="text-copy-muted">
            Choose a starter template to pre-populate your canvas. Any
            existing nodes will be replaced — use{" "}
            <kbd className="rounded-md border border-surface-border-subtle bg-subtle px-1.5 py-0.5 font-mono text-xs text-copy-secondary">
              Ctrl/⌘ Z
            </kbd>{" "}
            to undo.
          </DialogDescription>
        </DialogHeader>
        <div className="max-w-full overflow-x-auto">
          <div className="flex w-max gap-4 px-6 pb-6">
            {CANVAS_TEMPLATES.map((template) => (
              <article
                className="flex w-[17rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface"
                key={template.id}
              >
                <div className="border-b border-surface-border">
                  <TemplatePreview template={template} />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold text-copy-primary">
                    {template.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-5 text-copy-muted">
                    {template.description}
                  </p>
                  <Button
                    className="mt-4 w-full border-surface-border bg-transparent text-copy-primary hover:border-surface-border-subtle hover:bg-subtle"
                    onClick={() => importTemplate(template)}
                    type="button"
                    variant="outline"
                  >
                    <Download aria-hidden="true" />
                    Import
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
