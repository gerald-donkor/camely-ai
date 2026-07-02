import { redirect } from "next/navigation"

import { EditorWorkspace } from "@/components/editor/editor-workspace"
import { getCurrentClerkIdentity } from "@/lib/project-access"
import { getProjectLists } from "@/lib/projects"

export default async function EditorPage() {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    redirect("/sign-in")
  }

  const { ownedProjects, sharedProjects } = await getProjectLists(
    identity.userId,
    identity.primaryEmail,
  )

  return (
    <EditorWorkspace
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}
