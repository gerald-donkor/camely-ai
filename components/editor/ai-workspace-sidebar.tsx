"use client"

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { LiveList } from "@liveblocks/client"
import {
  useMutation,
  useSelf,
  useStorage,
} from "@liveblocks/react"
import {
  Bot,
  Download,
  FileText,
  LoaderCircle,
  Send,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AI_AGENT_COLOR,
  AI_AGENT_NAME,
  AI_AGENT_USER_ID,
  isAiStatusFeedActive,
  type AiDesignStatusMessage,
} from "@/types/ai-design"
import { NODE_COLORS } from "@/types/canvas"
import {
  AI_CHAT_FEED_KEY,
  isAiChatMessage,
  type AiChatMessage,
} from "@/types/tasks"
import type { designAgent } from "@/src/trigger/design-agent"
import type { generateSpec } from "@/src/trigger/generate-spec"

const ARCHITECT_SUGGESTIONS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

type AiWorkspaceTab = "architect" | "specs"

interface ProjectSpec {
  id: string
  projectId: string
  filePath: string
  createdAt: string
}

interface ActiveDesignRun {
  publicToken: string
  runId: string
}

interface DesignRunResponse {
  publicToken: string
  runId: string
}

interface AiWorkspaceSidebarProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  statusMessages: readonly AiDesignStatusMessage[]
}

const USER_MESSAGE_COLOR =
  NODE_COLORS.find(({ name }) => name === "Green") ?? NODE_COLORS[0]

type DesignRealtimeRun = NonNullable<
  ReturnType<typeof useRealtimeRun<typeof designAgent>>["run"]
>

export function AiWorkspaceSidebar({
  isOpen,
  onClose,
  roomId,
  statusMessages,
}: AiWorkspaceSidebarProps) {
  const [activeTab, setActiveTab] =
    useState<AiWorkspaceTab>("architect")
  const [prompt, setPrompt] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeRun, setActiveRun] = useState<ActiveDesignRun | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const completedRunIdsRef = useRef<Set<string>>(new Set())
  const subscriptionErrorRunIdsRef = useRef<Set<string>>(new Set())
  const latestStatusMessageRef = useRef<AiDesignStatusMessage | null>(null)
  const trimmedPrompt = prompt.trim()
  const latestStatusMessage = statusMessages.at(-1) ?? null
  const isAiWorking = isAiStatusFeedActive(latestStatusMessage)
  const isDesignRunActive = Boolean(activeRun)
  const isComposerDisabled = isSubmitting || isDesignRunActive
  const self = useSelf()
  const chatMessages =
    useStorage(
      (root) =>
        (root[AI_CHAT_FEED_KEY] ?? []).filter(isAiChatMessage),
    ) ?? []
  const nodes = useStorage((root) => (root as Record<string, unknown>).nodes as unknown[]) || []
  const edges = useStorage((root) => (root as Record<string, unknown>).edges as unknown[]) || []

  // Spec generation states
  const [activeSpecRun, setActiveSpecRun] = useState<ActiveDesignRun | null>(null)
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false)
  const [specs, setSpecs] = useState<ProjectSpec[]>([])
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false)
  const [specsError, setSpecsError] = useState<string | null>(null)
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpec | null>(null)
  const [specContent, setSpecContent] = useState<string | null>(null)
  const [isLoadingSpecContent, setIsLoadingSpecContent] = useState(false)

  const pushChatMessage = useMutation(
    ({ storage }, message: AiChatMessage) => {
      let feed = storage.get(AI_CHAT_FEED_KEY)

      if (!feed) {
        feed = new LiveList<AiChatMessage>([])
        storage.set(AI_CHAT_FEED_KEY, feed)
      }

      feed.push(message)
    },
    [],
  )
  const hasArchitectActivity =
    chatMessages.length > 0 ||
    isDesignRunActive ||
    isSubmitting

  useEffect(() => {
    latestStatusMessageRef.current = latestStatusMessage
  }, [latestStatusMessage])

  const pushAiMessage = useCallback(
    (content: string, role: AiChatMessage["role"] = "assistant") => {
      pushChatMessage({
        content,
        id: createChatMessageId(),
        role,
        roomId,
        sender: {
          avatar: "",
          color: AI_AGENT_COLOR,
          id: AI_AGENT_USER_ID,
          name: AI_AGENT_NAME,
        },
        timestamp: new Date().toISOString(),
        type: "ai-chat",
      })
    },
    [pushChatMessage, roomId],
  )

  const handleRunComplete = useCallback(
    (run: DesignRealtimeRun, error?: Error) => {
      if (completedRunIdsRef.current.has(run.id)) {
        return
      }

      completedRunIdsRef.current.add(run.id)

      const latestStatus = latestStatusMessageRef.current
      const statusText =
        latestStatus?.runId === run.id ? latestStatus.text?.trim() : undefined
      const failedMessage =
        error?.message ||
        run.error?.message ||
        `Design generation ended with ${formatRunStatus(run.status)}.`

      pushAiMessage(
        run.status === "COMPLETED"
          ? statusText || "Canvas updated."
          : failedMessage,
        run.status === "COMPLETED" ? "assistant" : "system",
      )
      setActiveRun((currentRun) =>
        currentRun?.runId === run.id ? null : currentRun,
      )
      setIsSubmitting(false)
      window.requestAnimationFrame(() => textareaRef.current?.focus())
    },
    [pushAiMessage],
  )
  const {
    error: realtimeError,
    run: realtimeRun,
  } = useRealtimeRun<typeof designAgent>(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: Boolean(activeRun),
    onComplete: handleRunComplete,
    skipColumns: ["payload", "output"],
  })

  // Spec list and load callbacks
  const fetchSpecs = useCallback(async () => {
    setIsLoadingSpecs(true)
    setSpecsError(null)
    try {
      const res = await fetch(`/api/projects/${roomId}/specs`)
      if (!res.ok) {
        throw new Error("Failed to load project specs")
      }
      const data = await res.json()
      setSpecs(data.specs || [])
    } catch (err) {
      console.error(err)
      setSpecsError("Unable to load project specs.")
    } finally {
      setIsLoadingSpecs(false)
    }
  }, [roomId])

  useEffect(() => {
    if (activeTab === "specs") {
      void Promise.resolve().then(() => fetchSpecs())
    }
  }, [activeTab, fetchSpecs])

  const handleSpecRunComplete = useCallback(
    () => {
      setActiveSpecRun(null)
      setIsGeneratingSpec(false)
      fetchSpecs()
    },
    [fetchSpecs],
  )

  const {
    error: realtimeSpecError,
  } = useRealtimeRun<typeof generateSpec>(activeSpecRun?.runId, {
    accessToken: activeSpecRun?.publicToken,
    enabled: Boolean(activeSpecRun),
    onComplete: handleSpecRunComplete,
    skipColumns: ["payload", "output"],
  })

  useEffect(() => {
    if (!activeSpecRun || !realtimeSpecError) {
      return
    }
    console.error("Spec run subscription error", realtimeSpecError)
    void Promise.resolve().then(() => {
      setActiveSpecRun(null)
      setIsGeneratingSpec(false)
    })
  }, [activeSpecRun, realtimeSpecError])

  useEffect(() => {
    const currentSpec = selectedSpec
    if (!currentSpec) {
      void Promise.resolve().then(() => setSpecContent(null))
      return
    }

    const specId = currentSpec.id

    async function loadSpecContent() {
      setIsLoadingSpecContent(true)
      try {
        const res = await fetch(`/api/projects/${roomId}/specs/${specId}/download`)
        if (!res.ok) {
          throw new Error("Failed to load specification file content")
        }
        const text = await res.text()
        setSpecContent(text)
      } catch (err) {
        console.error(err)
        setSpecContent("Error: Unable to load specification content. Please try downloading it directly.")
      } finally {
        setIsLoadingSpecContent(false)
      }
    }

    loadSpecContent()
  }, [selectedSpec, roomId])

  async function triggerSpecGeneration() {
    if (isGeneratingSpec || isAiWorking) {
      return
    }

    setIsGeneratingSpec(true)

    try {
      const response = await fetch("/api/ai/spec", {
        body: JSON.stringify({
          roomId,
          chatHistory: chatMessages,
          nodes,
          edges,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })

      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : `Spec generation failed with status ${response.status}`
        )
      }

      if (isDesignRunResponse(payload)) {
        setActiveSpecRun({
          publicToken: payload.publicToken,
          runId: payload.runId,
        })
      } else {
        throw new Error("Invalid response payload from spec generation trigger")
      }
    } catch (err) {
      console.error("Spec generation failed to trigger", err)
      setIsGeneratingSpec(false)
    }
  }

  function renderMarkdown(text: string) {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim()
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={i} className="text-sm font-bold text-copy-primary mt-4 mb-2">
            {trimmed.slice(4)}
          </h4>
        )
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={i} className="text-base font-bold text-copy-primary mt-6 mb-3 border-b border-surface-border-subtle pb-1">
            {trimmed.slice(3)}
          </h3>
        )
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={i} className="text-lg font-bold text-copy-primary mt-8 mb-4">
            {trimmed.slice(2)}
          </h2>
        )
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={i} className="text-xs text-copy-muted leading-relaxed ml-4 list-disc my-1">
            {trimmed.slice(2)}
          </li>
        )
      }
      if (trimmed.match(/^\d+\.\s/)) {
        const content = trimmed.replace(/^\d+\.\s/, "")
        return (
          <li key={i} className="text-xs text-copy-muted leading-relaxed ml-4 list-decimal my-1">
            {content}
          </li>
        )
      }
      if (trimmed.startsWith("```")) {
        return null
      }
      if (!trimmed) {
        return <div key={i} className="h-2" />
      }
      return (
        <p key={i} className="text-xs text-copy-muted leading-relaxed my-2">
          {trimmed}
        </p>
      )
    })
  }

  useEffect(() => {
    if (!activeRun || !realtimeError) {
      return
    }

    if (subscriptionErrorRunIdsRef.current.has(activeRun.runId)) {
      return
    }

    subscriptionErrorRunIdsRef.current.add(activeRun.runId)
    completedRunIdsRef.current.add(activeRun.runId)
    pushAiMessage(
      `Unable to track the design run: ${realtimeError.message}`,
      "system",
    )
    setActiveRun(null)
    setIsSubmitting(false)
  }, [activeRun, pushAiMessage, realtimeError])

  function selectSuggestion(suggestion: string) {
    setPrompt(suggestion)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  async function submitPrompt() {
    if (!trimmedPrompt || isComposerDisabled) {
      return
    }

    const submittedPrompt = trimmedPrompt
    const senderInfo = self?.info

    setIsSubmitting(true)

    try {
      pushChatMessage({
        content: submittedPrompt,
        id: createChatMessageId(),
        role: "user",
        roomId,
        sender: {
          avatar: senderInfo?.avatar,
          color: senderInfo?.color,
          id: self?.id ?? "unknown-user",
          name: senderInfo?.name || "Unknown user",
        },
        timestamp: new Date().toISOString(),
        type: "ai-chat",
      })
      setPrompt("")

      const response = await fetch("/api/ai/design", {
        body: JSON.stringify({
          prompt: submittedPrompt,
          roomId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(readErrorMessage(payload, response.status))
      }

      if (!isDesignRunResponse(payload)) {
        throw new Error("Design generation returned an invalid run handle.")
      }

      setActiveRun({
        publicToken: payload.publicToken,
        runId: payload.runId,
      })
    } catch (error) {
      pushAiMessage(
        error instanceof Error
          ? error.message
          : "Unable to start design generation.",
        "system",
      )
      setIsSubmitting(false)
      window.requestAnimationFrame(() => textareaRef.current?.focus())
    } finally {
      if (!activeRun) {
        setIsSubmitting(false)
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitPrompt()
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
    void submitPrompt()
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
          <p className="flex items-center gap-1.5 truncate text-xs text-copy-muted">
            {isAiWorking && (
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full bg-ai-text shadow-[0_0_10px_var(--accent-ai)]"
              />
            )}
            <span className="truncate">
              {isAiWorking ? "Camely AI is working" : "Collaborate with Ghost AI"}
            </span>
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
            {!hasArchitectActivity ? (
              <div className="flex min-h-full flex-col items-center pt-12 text-center">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-ai/15 text-ai-text ring-1 ring-ai/25">
                  <Bot aria-hidden="true" className="size-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-copy-primary">
                  Room chat
                </h3>
                <p className="mt-1.5 max-w-60 text-xs leading-5 text-copy-muted">
                  Ask Camely AI to design or revise the shared architecture.
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
              <div
                aria-live="polite"
                className="flex flex-col gap-3 pt-5"
              >
                {chatMessages.map((message) => (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    selfId={self?.id}
                  />
                ))}
              </div>
            )}
          </div>

          <form
            className="shrink-0 border-t border-surface-border p-3"
            onSubmit={handleSubmit}
          >
            {isDesignRunActive && (
              <AiStatusStrip
                message={latestStatusMessage}
                runStatus={realtimeRun?.status}
              />
            )}
            <div className="rounded-2xl border border-surface-border-subtle bg-elevated/70 p-2.5 shadow-inner focus-within:border-ai/50 focus-within:ring-2 focus-within:ring-ai/15">
              <Textarea
                ref={textareaRef}
                aria-label="Send a design prompt"
                className="max-h-36 min-h-20 resize-none border-0 bg-transparent p-0 text-sm leading-5 text-copy-primary shadow-none placeholder:text-copy-faint focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                placeholder="Ask Camely AI to change the architecture..."
                disabled={isComposerDisabled}
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
                  disabled={!trimmedPrompt || isComposerDisabled}
                  className="text-base hover:opacity-90 disabled:bg-subtle disabled:text-copy-faint disabled:opacity-70"
                  style={
                    !trimmedPrompt || isComposerDisabled
                      ? undefined
                      : {
                          backgroundColor: USER_MESSAGE_COLOR.textColor,
                        }
                  }
                >
                  {isSubmitting || isDesignRunActive ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-3.5 animate-spin"
                    />
                  ) : (
                    <Send aria-hidden="true" className="size-3.5" />
                  )}
                  {isSubmitting || isDesignRunActive ? "Running" : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div
          id="ai-specs-panel"
          aria-labelledby="ai-specs-tab"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
          role="tabpanel"
        >
          <Button
            type="button"
            className="h-9 w-full rounded-xl bg-ai text-copy-primary hover:bg-ai/85 flex items-center justify-center gap-1.5 shrink-0"
            disabled={isGeneratingSpec || isAiWorking}
            onClick={triggerSpecGeneration}
          >
            {isGeneratingSpec ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Generating Spec...
              </>
            ) : (
              "Generate Spec"
            )}
          </Button>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3">
              {isLoadingSpecs ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-copy-muted text-xs">
                  <LoaderCircle className="size-5 animate-spin text-ai" />
                  Loading specs...
                </div>
              ) : specsError ? (
                <div className="text-center py-12 text-error text-xs">
                  {specsError}
                </div>
              ) : specs.length === 0 ? (
                <div className="text-center py-12 text-copy-faint text-xs">
                  No specifications generated yet.
                </div>
              ) : (
                specs.map((spec) => {
                  const filename = spec.filePath.split("/").pop() || "specification.md"
                  return (
                    <article
                      key={spec.id}
                      className="rounded-2xl border border-surface-border-subtle bg-elevated/55 p-4 shadow-sm hover:border-surface-border transition-colors cursor-pointer"
                      onClick={() => setSelectedSpec(spec)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-subtle text-copy-muted">
                          <FileText aria-hidden="true" className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-copy-primary truncate">
                            {filename}
                          </h3>
                          <time className="mt-1 block text-[0.625rem] leading-none text-copy-faint" dateTime={spec.createdAt}>
                            {new Date(spec.createdAt).toLocaleString()}
                          </time>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-xl px-2.5 text-xs text-copy-muted hover:text-copy-primary"
                          onClick={() => setSelectedSpec(spec)}
                        >
                          Preview
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-xl px-2.5 text-xs text-copy-muted hover:text-copy-primary"
                          onClick={() => {
                            window.open(`/api/projects/${roomId}/specs/${spec.id}/download`, "_blank")
                          }}
                        >
                          <Download aria-hidden="true" className="size-3.5 mr-1" />
                          Download
                        </Button>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </ScrollArea>

          <Dialog open={selectedSpec !== null} onOpenChange={(open) => { if (!open) setSelectedSpec(null); }}>
            <DialogContent className="max-w-2xl bg-elevated border border-surface-border text-copy-primary rounded-3xl p-6 flex flex-col gap-0 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-surface-border [&_[data-slot=dialog-close]]:text-copy-muted">
              <DialogHeader className="pb-5">
                <DialogTitle className="text-lg font-bold">
                  {selectedSpec ? `Spec Preview - ${new Date(selectedSpec.createdAt).toLocaleString()}` : "Spec Preview"}
                </DialogTitle>
                <DialogDescription className="text-xs text-copy-muted mt-1">
                  Review the generated technical specification for this architecture.
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="min-h-0 flex-1 max-h-[60vh] border border-surface-border-subtle rounded-2xl bg-base p-4">
                {isLoadingSpecContent ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2 text-copy-muted text-xs">
                    <LoaderCircle className="size-5 animate-spin text-ai" />
                    Loading specification content...
                  </div>
                ) : specContent ? (
                  <div className="prose prose-invert max-w-none text-copy-primary">
                    {renderMarkdown(specContent)}
                  </div>
                ) : (
                  <div className="text-center py-20 text-copy-faint text-xs">
                    No content available.
                  </div>
                )}
              </ScrollArea>
              
              <div className="mt-5 flex justify-end gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9"
                  onClick={() => setSelectedSpec(null)}
                >
                  Close
                </Button>
                {selectedSpec && (
                  <Button
                    size="sm"
                    className="bg-ai text-copy-primary hover:bg-ai/85 rounded-xl h-9 flex items-center gap-1.5"
                    onClick={() => {
                      window.open(`/api/projects/${roomId}/specs/${selectedSpec.id}/download`, "_blank")
                    }}
                  >
                    <Download className="size-4" />
                    Download File
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </aside>
  )
}

function isDesignRunResponse(value: unknown): value is DesignRunResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const response = value as Record<string, unknown>

  return (
    typeof response.publicToken === "string" &&
    response.publicToken.length > 0 &&
    typeof response.runId === "string" &&
    response.runId.length > 0
  )
}

function readErrorMessage(value: unknown, status: number) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const message = (value as Record<string, unknown>).error

    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return `Design generation failed with status ${status}.`
}

function createChatMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function ChatMessageBubble({
  message,
  selfId,
}: {
  message: AiChatMessage
  selfId?: string
}) {
  const isOwnMessage = message.sender.id === selfId
  const messageTime = new Date(message.timestamp)

  return (
    <article
      className={cn(
        "max-w-[88%] rounded-2xl border px-3 py-2.5",
        isOwnMessage
          ? "ml-auto rounded-br-xl"
          : message.role === "system"
            ? "mr-auto rounded-bl-xl border-error/30 bg-error/10"
            : "mr-auto rounded-bl-xl border-surface-border bg-elevated",
      )}
      style={
        isOwnMessage
          ? {
              backgroundColor: USER_MESSAGE_COLOR.textColor,
              borderColor: USER_MESSAGE_COLOR.textColor,
              color: "var(--bg-base)",
            }
          : undefined
      }
    >
      <div
        className={cn(
          "mb-1 flex items-center gap-2 text-[0.625rem]",
          isOwnMessage ? "opacity-70" : "text-copy-faint",
        )}
      >
        <span
          className={cn(
            "truncate font-medium",
            !isOwnMessage && "text-copy-muted",
          )}
        >
          {isOwnMessage ? "You" : message.sender.name}
        </span>
        <span className="capitalize">{message.role}</span>
        {!Number.isNaN(messageTime.valueOf()) && (
          <time dateTime={message.timestamp}>
            {messageTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        )}
      </div>
      <p
        className={cn(
          "whitespace-pre-wrap break-words text-sm leading-5",
          !isOwnMessage && "text-copy-primary",
        )}
      >
        {message.content}
      </p>
    </article>
  )
}

function AiStatusStrip({
  message,
  runStatus,
}: {
  message: AiDesignStatusMessage | null
  runStatus?: string
}) {
  return (
    <div
      className="mb-2 flex items-center gap-2 rounded-xl border border-success/25 bg-base px-3 py-2 text-xs text-copy-secondary"
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 animate-pulse rounded-full bg-success shadow-[0_0_10px_var(--state-success)]"
      />
      <span className="min-w-0 flex-1 truncate">
        {message ? getStatusText(message) : "Starting Camely AI..."}
      </span>
      {runStatus && (
        <span className="shrink-0 font-mono text-[0.625rem] text-success">
          {formatRunStatus(runStatus)}
        </span>
      )}
    </div>
  )
}

function getStatusText(message: AiDesignStatusMessage) {
  return message.text?.trim() || "AI status updated."
}

function formatRunStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase()
}
