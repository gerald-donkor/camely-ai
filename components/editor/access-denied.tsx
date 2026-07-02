import { LockKeyhole } from "lucide-react"
import Link from "next/link"

export function AccessDenied() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-base px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-surface-border bg-surface text-copy-muted">
          <LockKeyhole aria-hidden="true" className="size-5" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-copy-primary">
          Project unavailable
        </h1>
        <p className="mt-2 text-sm leading-6 text-copy-muted">
          This project does not exist or you do not have permission to access
          it.
        </p>
        <Link
          href="/editor"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to editor
        </Link>
      </div>
    </main>
  )
}
