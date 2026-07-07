"use client"

import { useAuth, UserButton } from "@clerk/nextjs"
import type { CursorsCursorProps } from "@liveblocks/react-flow"
import {
  useOther,
  useOthersMapped,
} from "@liveblocks/react/suspense"

const MAX_VISIBLE_COLLABORATORS = 5

interface CanvasPresenceProps {
  isAiSidebarOpen?: boolean
}

interface CollaboratorIdentity {
  avatar: string
  id: string
  name: string
}

interface CollaboratorCursorIdentity {
  color: string
  id: string
  name: string
}

function isSameCollaborator(
  previous: CollaboratorIdentity,
  current: CollaboratorIdentity,
) {
  return (
    previous.avatar === current.avatar &&
    previous.id === current.id &&
    previous.name === current.name
  )
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase()
}

export function CanvasPresence({
  isAiSidebarOpen = false,
}: CanvasPresenceProps) {
  const { isLoaded, userId } = useAuth()
  const collaborators = useOthersMapped<CollaboratorIdentity>(
    (other) => ({
      avatar: other.info.avatar,
      id: other.id,
      name: other.info.name,
    }),
    isSameCollaborator,
  )
    .filter(([, collaborator]) => collaborator.id !== userId)
    .map(([connectionId, collaborator]) => ({
      connectionId,
      ...collaborator,
    }))
  const visibleCollaborators = collaborators.slice(
    0,
    MAX_VISIBLE_COLLABORATORS,
  )
  const overflowCount =
    collaborators.length - MAX_VISIBLE_COLLABORATORS

  if (!isLoaded) {
    return null
  }

  return (
    <div
      aria-label="Room participants"
      className={`absolute top-3 z-50 flex h-10 items-center rounded-xl border border-surface-border bg-surface/90 px-1.5 shadow-lg backdrop-blur-sm transition-[right] duration-200 md:z-30 ${
        isAiSidebarOpen ? "right-3 md:right-[21rem]" : "right-3"
      }`}
    >
      {visibleCollaborators.length > 0 && (
        <>
          <div
            aria-label={`${collaborators.length} active ${collaborators.length === 1 ? "collaborator" : "collaborators"}`}
            className="flex items-center pl-1"
          >
            {visibleCollaborators.map((collaborator, index) => (
              <div
                key={collaborator.connectionId}
                aria-label={collaborator.name}
                className={`relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated text-[0.6875rem] font-semibold text-copy-secondary ring-2 ring-base ${
                  index === 0 ? "" : "-ml-2"
                }`}
                role="img"
              >
                {collaborator.avatar ? (
                  // Liveblocks user metadata is populated from Clerk.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="size-full object-cover"
                    src={collaborator.avatar}
                  />
                ) : (
                  <span aria-hidden="true">
                    {getInitials(collaborator.name)}
                  </span>
                )}
              </div>
            ))}
            {overflowCount > 0 && (
              <div
                aria-label={`${overflowCount} more collaborators`}
                className="-ml-2 flex size-8 shrink-0 items-center justify-center rounded-lg bg-subtle text-[0.6875rem] font-semibold text-copy-secondary ring-2 ring-base"
              >
                +{overflowCount}
              </div>
            )}
          </div>
          <div
            aria-hidden="true"
            className="mx-2 h-5 w-px bg-surface-border"
          />
        </>
      )}
      <UserButton
        appearance={{
          elements: {
            userButtonTrigger:
              "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            avatarBox:
              "size-8 rounded-lg ring-1 ring-surface-border-subtle",
          },
        }}
      />
    </div>
  )
}

function isSameCursorIdentity(
  previous: CollaboratorCursorIdentity,
  current: CollaboratorCursorIdentity,
) {
  return (
    previous.color === current.color &&
    previous.id === current.id &&
    previous.name === current.name
  )
}

export function CanvasCursor({
  connectionId,
}: CursorsCursorProps) {
  const { isLoaded, userId } = useAuth()
  const collaborator = useOther(
    connectionId,
    (other): CollaboratorCursorIdentity => ({
      color: other.info.color,
      id: other.id,
      name: other.info.name.trim() || "Collaborator",
    }),
    isSameCursorIdentity,
  )

  if (!isLoaded || collaborator.id === userId) {
    return null
  }

  return (
    <div className="relative drop-shadow-md">
      <svg
        className="block size-5 drop-shadow-sm"
        fill="none"
        viewBox="0 0 20 20"
      >
        <path
          d="M3 2.5 16.2 10 10.4 11.4 7 17.2 3 2.5Z"
          fill={collaborator.color}
          stroke="var(--bg-base)"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
      <span
        className="absolute left-4 top-4 block max-w-44 truncate whitespace-nowrap rounded-xl border border-base/30 px-2.5 py-1 text-xs font-semibold shadow-lg"
        style={{
          backgroundColor: collaborator.color,
          color: "var(--text-primary)",
        }}
      >
        {collaborator.name}
      </span>
    </div>
  )
}
