export const AI_AGENT_USER_ID = "camely-ai-agent"
export const AI_AGENT_NAME = "Camely AI"
export const AI_AGENT_COLOR = "#8B82FF"

export {
  AI_STATUS_FEED_KEY,
  isAiStatusFeedActive,
  isAiStatusFeedMessage as isAiDesignStatusMessage,
} from "./tasks"
export type {
  AiStatusFeedLevel as AiDesignStatusLevel,
  AiStatusFeedMessage as AiDesignStatusMessage,
  AiStatusFeedPhase as AiDesignStatusPhase,
} from "./tasks"
