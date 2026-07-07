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

const ARCHITECT_SUGGESTIONS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

type AiWorkspaceTab = "architect" | "specs"

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
  const [specVersion, setSpecVersion] = useState(1)
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
