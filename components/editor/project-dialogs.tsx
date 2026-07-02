"use client"

import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ProjectActionsController } from "@/hooks/use-project-actions"

interface ProjectDialogsProps {
  controller: ProjectActionsController
}

export function ProjectDialogs({ controller }: ProjectDialogsProps) {
  const {
    closeDialog,
    dialog,
    errorMessage,
    isLoading,
    projectName,
    roomIdPreview,
    setProjectName,
    submitDialog,
  } = controller

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitDialog()
  }

  const isDelete = dialog?.type === "delete"
  const isRename = dialog?.type === "rename"
  const isCreate = dialog?.type === "create"

  return (
    <Dialog
      open={dialog !== null}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog()
        }
      }}
    >
      <DialogContent className="gap-4 rounded-3xl border border-surface-border bg-elevated p-4 text-copy-primary ring-0 sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg">
              {isCreate && "New Project"}
              {isRename && "Rename Project"}
              {isDelete && "Delete Project"}
            </DialogTitle>
            <DialogDescription className="text-copy-muted">
              {isCreate && "Give your project a name to get started."}
              {isRename &&
                `Choose a new name for “${dialog.project.name}”.`}
              {isDelete &&
                `Permanently delete “${dialog.project.name}”? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          {!isDelete && (
            <div className="mt-4">
              {isRename && (
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-sm font-medium text-copy-primary"
                >
                  Project name
                </label>
              )}
              <Input
                id="project-name"
                name="projectName"
                value={projectName}
                placeholder="Project name"
                className="text-copy-primary placeholder:text-copy-muted"
                autoFocus={isRename}
                disabled={isLoading}
                onChange={(event) => setProjectName(event.target.value)}
              />
              {isCreate && roomIdPreview && (
                <p className="mt-2 font-mono text-xs text-copy-muted">
                  Room ID: {roomIdPreview}
                </p>
              )}
            </div>
          )}

          {errorMessage && (
            <p role="alert" className="mt-4 text-sm text-error">
              {errorMessage}
            </p>
          )}

          <DialogFooter className="-mx-4 -mb-4 mt-5 flex-row justify-end rounded-b-3xl border-surface-border bg-subtle/50 px-4 py-4">
            <Button
              type="submit"
              variant={isDelete ? "destructive" : "default"}
              disabled={
                isLoading || (!isDelete && projectName.trim().length === 0)
              }
            >
              {isLoading
                ? "Working..."
                : isCreate
                  ? "Create Project"
                  : isRename
                    ? "Save Changes"
                    : "Delete Project"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={closeDialog}
            >
              Close
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
