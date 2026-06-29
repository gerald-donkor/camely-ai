"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface EmptyProjectsProps {
  description: string
}

function EmptyProjects({ description }: EmptyProjectsProps) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-surface-border p-6 text-center">
      <p className="text-sm text-copy-muted">{description}</p>
    </div>
  )
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      id="project-sidebar"
      aria-label="Projects"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "fixed bottom-3 left-3 top-17 z-40 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen
          ? "translate-x-0"
          : "-translate-x-[calc(100%+0.75rem)] pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="font-heading text-base font-medium text-copy-primary">
          Projects
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close project sidebar"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <Tabs defaultValue="my-projects" className="min-h-0 flex-1 p-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>
        <TabsContent value="my-projects" className="mt-2 flex min-h-0">
          <EmptyProjects description="Your projects will appear here." />
        </TabsContent>
        <TabsContent value="shared" className="mt-2 flex min-h-0">
          <EmptyProjects description="Projects shared with you will appear here." />
        </TabsContent>
      </Tabs>

      <div className="border-t border-surface-border p-4">
        <Button type="button" className="w-full">
          <Plus aria-hidden="true" />
          New Project
        </Button>
      </div>
    </aside>
  )
}
