import { z } from "zod"

export const AI_CHAT_FEED_KEY = "ai-chat"
export const AI_STATUS_FEED_KEY = "ai-status-feed"

const aiChatSenderSchema = z.object({
  avatar: z.string().optional(),
  color: z.string().optional(),
  id: z.string().min(1),
  name: z.string().min(1),
})

export const aiChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  id: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  roomId: z.string().min(1),
  sender: aiChatSenderSchema,
  timestamp: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  type: z.literal("ai-chat"),
})

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>

export function isAiChatMessage(value: unknown): value is AiChatMessage {
  return aiChatMessageSchema.safeParse(value).success
}

export type AiStatusFeedPhase =
  | "start"
  | "processing"
  | "complete"
  | "error"

export type AiStatusFeedLevel = "info" | "success" | "error"

export type AiStatusFeedSource = "design" | "spec"

export interface AiStatusFeedMessage
  extends Record<string, string | number | undefined> {
  actionCount?: number
  createdAt: string
  id: string
  level: AiStatusFeedLevel
  phase: AiStatusFeedPhase
  roomId: string
  runId?: string
  source: AiStatusFeedSource
  text?: string
  type: "ai-status"
}

export function isAiStatusFeedMessage(
  value: unknown,
): value is AiStatusFeedMessage {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const message = value as Record<string, unknown>
  const hasValidActionCount =
    message.actionCount === undefined ||
    (typeof message.actionCount === "number" &&
      Number.isFinite(message.actionCount) &&
      message.actionCount >= 0)

  return (
    message.type === "ai-status" &&
    typeof message.createdAt === "string" &&
    typeof message.id === "string" &&
    (message.level === "info" ||
      message.level === "success" ||
      message.level === "error") &&
    (message.phase === "start" ||
      message.phase === "processing" ||
      message.phase === "complete" ||
      message.phase === "error") &&
    typeof message.roomId === "string" &&
    (message.runId === undefined || typeof message.runId === "string") &&
    (message.source === "design" || message.source === "spec") &&
    (message.text === undefined || typeof message.text === "string") &&
    hasValidActionCount
  )
}

export function isAiStatusFeedActive(
  message: AiStatusFeedMessage | null | undefined,
) {
  return message?.phase === "start" || message?.phase === "processing"
}
