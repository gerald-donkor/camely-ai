"use client"

import type { FormEvent } from "react"
import { Copy, Mail, Trash2, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ShareDialogController } from "@/hooks/use-share-dialog"

interface ShareDialogProps {
  controller: ShareDialogController
  isOwner: boolean
  projectName: string
}

export function ShareDialog({
  controller,
  isOwner,
  projectName,
}: ShareDialogProps) {
  const {
    closeDialog,
    collaborators,
    copyProjectLink,
    email,
    errorMessage,
    inviteCollaborator,
    isCopied,
    isLoading,
    isMutating,
    isOpen,
    owner,
    removeCollaborator,
    setEmail,
  } = controller

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void inviteCollaborator()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog()
        }
      }}
    >
      <DialogContent className="gap-0 overflow-hidden rounded-3xl border border-surface-border bg-elevated p-0 text-copy-primary ring-0 sm:max-w-lg">
        <DialogHeader className="border-b border-surface-border px-5 py-5">
          <DialogTitle className="text-lg">Share {projectName}</DialogTitle>
          <DialogDescription className="text-copy-muted">
            {isOwner
              ? "Invite collaborators and manage who can access this workspace."
              : "View the people who currently have access to this workspace."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5">
          {isOwner && (
            <form className="flex gap-2" onSubmit={handleInvite}>
              <div className="relative min-w-0 flex-1">
                <Mail
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-copy-faint"
                />
                <Input
                  type="email"
                  value={email}
                  placeholder="collaborator@example.com"
                  aria-label="Collaborator email"
                  className="pl-9 text-copy-primary placeholder:text-copy-muted"
                  disabled={isMutating}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={isMutating || email.trim().length === 0}
              >
                {isMutating ? "Inviting..." : "Invite"}
              </Button>
            </form>
          )}

          <section aria-labelledby="collaborators-heading">
            <h3
              id="collaborators-heading"
              className="text-sm font-medium text-copy-primary"
            >
              People with access
            </h3>
            {!isLoading && (
              <p className="text-xs text-copy-faint">
                {collaborators.length + (owner ? 1 : 0)} total
              </p>
            )}

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {isLoading && (
                <p className="rounded-2xl border border-surface-border p-4 text-sm text-copy-muted">
                  Loading collaborators...
                </p>
              )}

              {!isLoading && owner && (
                <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface px-3 py-3">
                  {owner.imageUrl ? (
                    // Clerk controls this authenticated user avatar URL.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={owner.imageUrl}
                      alt=""
                      className="size-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-subtle text-copy-muted">
                      <UserRound aria-hidden="true" className="size-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-medium text-copy-primary">
                        {owner.displayName}
                      </p>
                      <span className="rounded-xl bg-accent-dim px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-brand">
                        Owner
                      </span>
                    </div>
                    {owner.email && (
                      <p className="truncate text-xs text-copy-muted">
                        {owner.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!isLoading && !owner && collaborators.length === 0 && (
                <p className="rounded-2xl border border-dashed border-surface-border-subtle p-4 text-sm text-copy-muted">
                  No access details are available.
                </p>
              )}

              {!isLoading &&
                collaborators.map((collaborator) => (
                  <div
                    key={collaborator.email}
                    className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface px-3 py-3"
                  >
                    {collaborator.imageUrl ? (
                      // Clerk controls this authenticated user avatar URL.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={collaborator.imageUrl}
                        alt=""
                        className="size-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-subtle text-copy-muted">
                        <UserRound aria-hidden="true" className="size-4" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        {collaborator.displayName && (
                          <p className="truncate text-sm font-medium text-copy-primary">
                            {collaborator.displayName}
                          </p>
                        )}
                        <span className="rounded-xl border border-surface-border-subtle px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-copy-muted">
                          Collaborator
                        </span>
                      </div>
                      <p className="truncate text-xs text-copy-muted">
                        {collaborator.email}
                      </p>
                    </div>

                    {isOwner && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-error hover:text-error"
                        disabled={isMutating}
                        aria-label={`Remove ${collaborator.email}`}
                        onClick={() =>
                          void removeCollaborator(collaborator.email)
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </section>

          {errorMessage && (
            <p role="alert" className="text-sm text-error">
              {errorMessage}
            </p>
          )}
        </div>

        {isOwner && (
          <div className="flex items-center justify-between gap-3 border-t border-surface-border bg-subtle/50 px-5 py-4">
            <p className="text-xs text-copy-muted">
              Anyone added by email can open this project.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyProjectLink()}
            >
              <Copy aria-hidden="true" />
              {isCopied ? "Copied!" : "Copy link"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
