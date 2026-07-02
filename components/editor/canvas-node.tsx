import type { NodeProps } from "@xyflow/react"

import type { CanvasNode } from "@/types/canvas"

export function CanvasNodeRenderer({ data }: NodeProps<CanvasNode>) {
  const shape = (() => {
    switch (data.shape) {
      case "diamond":
        return <polygon points="50,2 98,50 50,98 2,50" />
      case "circle":
        return <ellipse cx="50" cy="50" rx="48" ry="48" />
      case "pill":
        return <rect height="96" rx="48" width="96" x="2" y="2" />
      case "cylinder":
        return (
          <>
            <path d="M2 18v64c0 9 21.5 16 48 16s48-7 48-16V18" />
            <ellipse cx="50" cy="18" rx="48" ry="16" />
            <path d="M2 82c0-9 21.5-16 48-16s48 7 48 16" />
          </>
        )
      case "hexagon":
        return <polygon points="25,2 75,2 98,50 75,98 25,98 2,50" />
      case "rectangle":
        return <rect height="96" rx="10" width="96" x="2" y="2" />
    }
  })()

  return (
    <div
      className="relative size-full text-copy-primary"
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <g
          fill={data.color}
          stroke="var(--border-subtle)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        >
          {shape}
        </g>
      </svg>
      <div className="relative z-10 flex size-full items-center justify-center px-4 text-center text-sm">
        {data.label}
      </div>
    </div>
  )
}
