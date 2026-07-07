import type { LiveList } from "@liveblocks/client"

import type { AiChatMessage, AiStatusFeedMessage } from "./types/tasks"

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null
      thinking: boolean
    };

    UserMeta: {
      id: string;
      info: {
        name: string
        avatar: string
        color: string
      };
    };

    RoomEvent: AiStatusFeedMessage

    Storage: {
      "ai-chat"?: LiveList<AiChatMessage>
      "ai-status-feed"?: LiveList<AiStatusFeedMessage>
    }

  }
}

export {}
