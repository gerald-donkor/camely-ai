import "server-only"

import { Liveblocks } from "@liveblocks/node"

const CURSOR_COLORS = [
  "#52A8FF",
  "#BF7AF0",
  "#FF990A",
  "#FF6166",
  "#F75F8F",
  "#62C073",
  "#0AC7B4",
] as const

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined
}

export function getCursorColor(userId: string) {
  let hash = 0

  for (const character of userId) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0
  }

  return CURSOR_COLORS[hash % CURSOR_COLORS.length]
}

export function getLiveblocksClient() {
  if (globalForLiveblocks.liveblocks) {
    return globalForLiveblocks.liveblocks
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not configured")
  }

  const client = new Liveblocks({ secret })
  globalForLiveblocks.liveblocks = client

  return client
}
