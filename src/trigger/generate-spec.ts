import { AbortTaskRunError, logger, schemaTask } from "@trigger.dev/sdk"
import { LiveList, Liveblocks } from "@liveblocks/node"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateText } from "ai"
import { z } from "zod"

import {
  AI_AGENT_COLOR,
  AI_AGENT_NAME,
  AI_AGENT_USER_ID,
  AI_STATUS_FEED_KEY,
  type AiDesignStatusLevel,
  type AiDesignStatusMessage,
  type AiDesignStatusPhase,
} from "../../types/ai-design"

const DEFAULT_MODEL_ID = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"

const specPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(z.any()),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
})

interface NodeLike {
  id: string
  data?: {
    label?: string
    shape?: string
    color?: string
  }
}

interface EdgeLike {
  source: string
  target: string
  data?: {
    label?: string
  }
}

interface ChatMessageLike {
  role: string
  content: string
  timestamp?: string
  sender?: {
    name?: string
  }
}

const globalForSpecAgent = globalThis as unknown as {
  specAgentLiveblocks?: Liveblocks
}

function getLiveblocksClient() {
  if (globalForSpecAgent.specAgentLiveblocks) {
    return globalForSpecAgent.specAgentLiveblocks
  }

  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY?.trim()

  if (!secretKey) {
    throw new AbortTaskRunError("LIVEBLOCKS_SECRET_KEY is not configured")
  }

  const client = new Liveblocks({ secret: secretKey })

  if (process.env.NODE_ENV !== "production") {
    globalForSpecAgent.specAgentLiveblocks = client
  }

  return client
}

function getOpenRouterModel() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()

  if (!apiKey) {
    throw new AbortTaskRunError("OPENROUTER_API_KEY is not configured")
  }

  const openrouter = createOpenRouter({
    apiKey,
    appName: "Camely AI",
  })
  const modelId = process.env.OPENROUTER_DESIGN_MODEL?.trim() || DEFAULT_MODEL_ID

  return openrouter.chat(modelId, {
    usage: { include: true },
    extraBody: {
      max_tokens: 4000,
    },
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Unknown spec-agent failure"
}

async function updateAiPresence(
  client: Liveblocks,
  roomId: string,
  thinking: boolean,
  cursor: { x: number; y: number } | null,
  ttl = 60,
) {
  await client.setPresence(roomId, {
    data: { cursor, thinking },
    ttl,
    userId: AI_AGENT_USER_ID,
    userInfo: {
      avatar: "",
      color: AI_AGENT_COLOR,
      name: AI_AGENT_NAME,
    },
  })
}

interface StatusOptions {
  level?: AiDesignStatusLevel
  message: string
  phase: AiDesignStatusPhase
  roomId: string
  runId: string
}

async function publishStatus(client: Liveblocks, options: StatusOptions) {
  const status: AiDesignStatusMessage = {
    createdAt: new Date().toISOString(),
    id: `${options.runId}-spec-${options.phase}-${Date.now()}`,
    level:
      options.level ??
      (options.phase === "complete"
        ? "success"
        : options.phase === "error"
        ? "error"
        : "info"),
    phase: options.phase,
    roomId: options.roomId,
    runId: options.runId,
    source: "spec",
    text: options.message,
    type: "ai-status",
  }

  await client.mutateStorage(options.roomId, ({ root }) => {
    let feed = root.get(AI_STATUS_FEED_KEY)

    if (!feed) {
      feed = new LiveList<AiDesignStatusMessage>([])
      root.set(AI_STATUS_FEED_KEY, feed)
    }

    const MAX_STATUS_MESSAGES = 24
    while (feed.length >= MAX_STATUS_MESSAGES) {
      feed.delete(0)
    }

    feed.push(status)
  })

  try {
    await client.broadcastEvent(options.roomId, status)
  } catch (error) {
    logger.warn("Unable to broadcast AI spec status event", {
      error: getErrorMessage(error),
      roomId: options.roomId,
    })
  }

  return status
}

function formatDiagramAsText(nodes: NodeLike[], edges: EdgeLike[]): string {
  let text = "### Diagram Nodes (Components):\n"
  if (nodes.length === 0) {
    text += "No components are currently defined on the canvas.\n"
  } else {
    nodes.forEach((node, i) => {
      const data = node.data || {}
      text += `${i + 1}. [ID: ${node.id}] Label: "${data.label || "Untitled Component"}", Shape: ${data.shape || "rectangle"}, Color: ${data.color || "Neutral"}\n`
    })
  }

  text += "\n### Diagram Edges (Connections):\n"
  if (edges.length === 0) {
    text += "No connections are currently defined between components.\n"
  } else {
    edges.forEach((edge, i) => {
      const data = edge.data || {}
      text += `${i + 1}. Connection: [Node ${edge.source}] ---> [Node ${edge.target}]`
      if (data.label) {
        text += ` (Label: "${data.label}")`
      }
      text += "\n"
    })
  }

  return text
}

function formatChatHistoryAsText(chatHistory: ChatMessageLike[]): string {
  let text = "### Discussion History:\n"
  if (!chatHistory || chatHistory.length === 0) {
    text += "No conversation history exists for this project.\n"
  } else {
    chatHistory.forEach((msg) => {
      const senderName = msg.sender?.name || (msg.role === "user" ? "User" : "AI")
      text += `[${msg.timestamp || "Recent"}] ${senderName} (${msg.role}): ${msg.content}\n`
    })
  }
  return text
}

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: specPayloadSchema,
  run: async (payload, { ctx, signal }) => {
    const client = getLiveblocksClient()
    const runId = ctx.run.id

    logger.info("Spec generation task started", {
      projectId: payload.projectId,
      roomId: payload.roomId,
      runId,
    })

    try {
      await updateAiPresence(client, payload.roomId, true, { x: 0, y: 0 })
      await publishStatus(client, {
        message: "Camely AI is reading the canvas design and discussion context.",
        phase: "start",
        roomId: payload.roomId,
        runId,
      })

      await publishStatus(client, {
        message: "Analyzing components, connections, and user requirements.",
        phase: "processing",
        roomId: payload.roomId,
        runId,
      })

      const diagramText = formatDiagramAsText(payload.nodes, payload.edges)
      const chatText = formatChatHistoryAsText(payload.chatHistory)

      await publishStatus(client, {
        message: "Generating high-quality Markdown Technical Specification...",
        phase: "processing",
        roomId: payload.roomId,
        runId,
      })

      const prompt = `Here is the current architectural design diagram and discussion transcript. Please generate a detailed, professional, and comprehensive Markdown Technical Specification based on them.

---
${diagramText}

---
${chatText}
`

      const systemPrompt = `You are Camely AI, an elite systems architect assistant. Your task is to analyze a collaborative systems architecture diagram and its discussion history, then produce a comprehensive, professional, production-ready Markdown Technical Specification (spec) for the system.

Guidelines for the technical spec:
- Start directly with the markdown content. Do NOT wrap the entire document in backticks (\`\`\`markdown ... \`\`\`).
- Be highly detailed, technical, analytical, and professional in your style.
- Use clean Markdown syntax with headers, bullet points, code snippets, and tables where appropriate.
- Fully analyze all nodes (components, boundaries, services) and edges (data flows, communication pathways, API endpoints) in the canvas.
- Incorporate key insights and requirements from the chat conversation transcript between the user and Camely.
- Organize the document into logical sections (e.g., Executive Summary, Architectural Overview, Detailed Component Deep-Dive, Data Flow & Interactions, Non-Functional Requirements, Next Steps).`

      const result = await generateText({
        abortSignal: signal,
        maxOutputTokens: 4000,
        maxRetries: 1,
        model: getOpenRouterModel(),
        prompt,
        system: systemPrompt,
        temperature: 0.3,
      })

      const markdownOutput = result.text.trim()

      if (!markdownOutput) {
        throw new Error("The model did not produce any spec output.")
      }

      await publishStatus(client, {
        level: "success",
        message: "Technical specification generated successfully.",
        phase: "complete",
        roomId: payload.roomId,
        runId,
      })

      logger.info("Spec generation task completed successfully", {
        projectId: payload.projectId,
        roomId: payload.roomId,
        runId,
      })

      return markdownOutput
    } catch (error) {
      logger.error("Spec generation task failed", {
        error: getErrorMessage(error),
        projectId: payload.projectId,
        roomId: payload.roomId,
        runId,
      })

      try {
        await publishStatus(client, {
          level: "error",
          message: "Specification generation failed safely. Please try again.",
          phase: "error",
          roomId: payload.roomId,
          runId,
        })
      } catch (statusError) {
        logger.error("Unable to publish AI spec error status", {
          error: getErrorMessage(statusError),
          roomId: payload.roomId,
          runId,
        })
      }

      throw error
    } finally {
      try {
        await updateAiPresence(client, payload.roomId, false, null, 2)
      } catch (presenceError) {
        logger.warn("Unable to clear AI spec presence", {
          error: getErrorMessage(presenceError),
          roomId: payload.roomId,
          runId,
        })
      }
    }
  },
})
