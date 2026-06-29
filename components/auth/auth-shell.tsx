import { BrainCircuit, FileText, Share2, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface AuthShellProps {
  children: ReactNode
}

interface AuthFeature {
  description: string
  icon: LucideIcon
  title: string
}

const features: AuthFeature[] = [
  {
    title: "AI Architecture Generation",
    description:
      "Describe your system, and AI maps it to nodes and edges on a live canvas.",
    icon: BrainCircuit,
  },
  {
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
    icon: Share2,
  },
  {
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
    icon: FileText,
  },
]

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-dvh bg-base lg:grid-cols-2">
      <section className="hidden border-r border-surface-border bg-surface px-10 py-9 lg:flex lg:flex-col xl:px-12">
        <div className="flex items-center gap-2.5 text-copy-primary">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-full bg-brand font-mono text-xs font-bold text-base"
          >
            C
          </span>
          <span className="font-heading text-sm font-semibold">
            Camely AI
          </span>
        </div>

        <div className="my-auto max-w-[32rem] pb-8">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-copy-primary">
            Build design systems as fast as your mind moves.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-copy-secondary">
            Using plain language, describe your architecture. Camely AI translates it into a collaborative canvas your entire team can shape together, live.
          </p>

          <ul className="mt-10 space-y-6">
            {features.map(({ description, icon: Icon, title }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-dim text-brand">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="pt-0.5">
                  <span className="block text-sm font-semibold text-copy-primary">
                    {title}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-copy-muted">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-copy-faint">
          © 2026 Camely AI. All rights reserved.
        </p>
      </section>

      <section className="flex min-h-dvh items-center justify-center bg-base px-4 py-8 sm:px-8">
        <div className="w-full max-w-[23.5rem]">{children}</div>
      </section>
    </main>
  )
}
