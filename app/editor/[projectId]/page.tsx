import { auth, currentUser } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"

import { EditorWorkspace } from "@/components/editor/editor-workspace"
import { getProjectLists } from "@/lib/projects"

export default async function ProjectWorkspacePage(
  props: PageProps<"/editor/[projectId]">,
) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const [{ projectId }, user] = await Promise.all([
    props.params,
    currentUser(),
  ])
  const email = user?.primaryEmailAddress?.emailAddress ?? null
  const { ownedProjects, sharedProjects } = await getProjectLists(userId, email)
  const canAccessProject = [...ownedProjects, ...sharedProjects].some(
    (project) => project.id === projectId,
  )

  if (!canAccessProject) {
    notFound()
  }

  return (
    <EditorWorkspace
      activeProjectId={projectId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}
