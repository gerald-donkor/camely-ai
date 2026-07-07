"use client"

import {
  type FormEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from "react"
import { Bot, Download, FileText, Send, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const ARCHITECT_SUGGESTIONS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

type AiWorkspaceTab = "architect" | "specs"

interface AiWorkspaceSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AiWorkspaceSidebar({
  isOpen,
  onClose,
}: AiWorkspaceSidebarProps) {
  const [activeTab, setActiveTab] =
    useState<AiWorkspaceTab>("architect")
  const [prompt, setPrompt] = useState("")
  const [specVersion, setSpecVersion] = useState(1)
  const [submittedPrompts, setSubmittedPrompts] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const trimmedPrompt = prompt.trim()

  function selectSuggestion(suggestion: string) {
    setPrompt(suggestion)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function submitPrompt() {
    if (!trimmedPrompt) {
      return
    }

    setSubmittedPrompts((currentPrompts) => [
      ...currentPrompts,
      trimmedPrompt,
    ])
    setPrompt("")
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitPrompt()
  }

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }

    event.preventDefault()
    submitPrompt()
  }

  return (
    <aside
      id="ai-sidebar"
      aria-label="AI workspace"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "absolute bottom-3 right-3 top-3 z-40 flex w-[min(19.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-md transition-transform duration-200 ease-out",
        isOpen
          ? "translate-x-0"
          : "pointer-events-none translate-x-[calc(100%+0.75rem)]",
      )}
    >
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-surface-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text ring-1 ring-ai/25">
          <Bot aria-hidden="true" className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-copy-primary">
            AI Workspace
          </h2>
          <p className="truncate text-xs text-copy-muted">
            Collaborate with Ghost AI
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close AI workspace"
          className="text-copy-faint hover:bg-subtle hover:text-copy-primary"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </Button>
      </header>

      <div
        aria-label="AI workspace views"
        className="mx-4 mt-3 flex w-fit rounded-xl bg-elevated p-1"
        role="tablist"
      >
        <button
          type="button"
          id="ai-architect-tab"
          aria-controls="ai-architect-panel"
          aria-selected={activeTab === "architect"}
          className={cn(
            "rounded-lg px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            activeTab === "architect"
              ? "bg-ai text-copy-primary shadow-sm"
              : "text-copy-muted hover:text-copy-primary",
          )}
          role="tab"
          onClick={() => setActiveTab("architect")}
        >
          AI Architect
        </button>
        <button
          type="button"
          id="ai-specs-tab"
          aria-controls="ai-specs-panel"
          aria-selected={activeTab === "specs"}
          className={cn(
            "rounded-lg px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            activeTab === "specs"
              ? "bg-ai text-copy-primary shadow-sm"
              : "text-copy-muted hover:text-copy-primary",
          )}
          role="tab"
          onClick={() => setActiveTab("specs")}
        >
          Specs
        </button>
      </div>

      {activeTab === "architect" ? (
        <div
          id="ai-architect-panel"
          aria-labelledby="ai-architect-tab"
          className="flex min-h-0 flex-1 flex-col"
          role="tabpanel"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {submittedPrompts.length === 0 ? (
              <div className="flex min-h-full flex-col items-center pt-12 text-center">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-ai/15 text-ai-text ring-1 ring-ai/25">
                  <Bot aria-hidden="true" className="size-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-copy-primary">
                  Camely AI Architect
                </h3>
                <p className="mt-1.5 max-w-60 text-xs leading-5 text-copy-muted">
                  Describe your system and I&apos;ll help you design the
                  architecture.
                </p>
                <div className="mt-5 flex w-full flex-col gap-2">
                  {ARCHITECT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="w-full rounded-xl border border-transparent bg-elevated px-3 py-2 text-left text-xs text-ai-text transition-colors outline-none hover:border-ai/30 hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/60"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-5">
                {submittedPrompts.map((submittedPrompt, index) => (
                  <div
                    key={`${submittedPrompt}-${index}`}
                    className="ml-8 rounded-2xl rounded-br-xl border border-ai/25 bg-ai/10 px-3 py-2.5 text-sm leading-5 text-copy-primary"
                  >
                    {submittedPrompt}
                  </div>
                ))}
                <div className="mr-7 flex gap-2.5 rounded-2xl border border-surface-border bg-elevated px-3 py-3">
                  <Bot
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-ai-text"
                  />
                  <p className="text-xs leading-5 text-copy-muted">
                    Your prompt is ready. AI generation will connect here in
                    the next workflow step.
                  </p>
                </div>
              </div>
            )}
          </div>

          <form
            className="shrink-0 border-t border-surface-border p-3"
            onSubmit={handleSubmit}
          >
            <div className="rounded-2xl border border-surface-border-subtle bg-elevated/70 p-2.5 shadow-inner focus-within:border-ai/50 focus-within:ring-2 focus-within:ring-ai/15">
              <Textarea
                ref={textareaRef}
                aria-label="Describe the architecture to Camely AI"
                className="max-h-36 min-h-20 resize-none border-0 bg-transparent p-0 text-sm leading-5 text-copy-primary shadow-none placeholder:text-copy-faint focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                placeholder="Describe your architecture..."
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleComposerKeyDown}
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[0.625rem] text-copy-faint">
                  Shift+Enter for new line
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!trimmedPrompt}
                  className="bg-ai text-copy-primary hover:bg-ai/80"
                >
                  <Send aria-hidden="true" className="size-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div
          id="ai-specs-panel"
          aria-labelledby="ai-specs-tab"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
          role="tabpanel"
        >
          <Button
            type="button"
            className="h-9 w-full rounded-xl bg-ai text-copy-primary hover:bg-ai/85"
            onClick={() => setSpecVersion((version) => version + 1)}
          >
            Generate Spec
          </Button>

          <article className="mt-4 rounded-2xl border border-surface-border-subtle bg-elevated/55 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-subtle text-copy-muted">
                <FileText aria-hidden="true" className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-copy-primary">
                  System Architecture v{specVersion}
                </h3>
                <p className="mt-1 text-xs leading-5 text-copy-muted">
                  Microservices design with API gateway, authentication
                  service, and event-driven communication between bounded
                  services.
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled
                aria-label="Download will be available after persisted spec generation is connected"
                className="text-copy-faint"
              >
                <Download aria-hidden="true" className="size-3.5" />
                Download
              </Button>
            </div>
          </article>
        </div>
      )}
    </aside>
  )
}
