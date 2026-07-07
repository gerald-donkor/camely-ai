interface LiveblocksTokenResult {
  token: string
}

interface LiveblocksErrorResult {
  error: "authentication_error" | "forbidden"
  reason: string
}

type LiveblocksAuthResult =
  | LiveblocksErrorResult
  | LiveblocksTokenResult

function readStringProperty(
  value: unknown,
  property: "error" | "reason" | "token",
) {
  if (!value || typeof value !== "object") {
    return null
  }

  const propertyValue = (value as Record<string, unknown>)[property]

  return typeof propertyValue === "string" && propertyValue.trim()
    ? propertyValue.trim()
    : null
}

export async function authenticateLiveblocks(
  room: string | undefined,
): Promise<LiveblocksAuthResult> {
  try {
    const response = await fetch("/api/liveblocks-auth", {
      body: JSON.stringify({ room }),
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    const result: unknown = await response.json()
    const token = readStringProperty(result, "token")

    if (response.ok && token) {
      return { token }
    }

    const reason =
      readStringProperty(result, "reason") ??
      readStringProperty(result, "error") ??
      `Authentication request failed with status ${response.status}`

    return {
      error:
        response.status === 401 || response.status === 403
          ? "forbidden"
          : "authentication_error",
      reason,
    }
  } catch (error) {
    console.error("Liveblocks authentication request failed", error)

    return {
      error: "authentication_error",
      reason: "The collaboration service could not be reached",
    }
  }
}
