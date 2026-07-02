import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { ProjectWorkspace } from "@/components/editor/project-workspace"
import {
  getCurrentClerkIdentity,
  getProjectForIdentity,
} from "@/lib/project-access"
import { getProjectLists } from "@/lib/projects"

export default async function ProjectWorkspacePage(
  props: PageProps<"/editor/[roomId]">,
) {
  const identity = await getCurrentClerkIdentity()

  if (!identity) {
    redirect("/sign-in")
  }

  const { roomId } = await props.params
  const project = await getProjectForIdentity(roomId, identity)

  if (!project) {
    return <AccessDenied />
  }

  const { ownedProjects, sharedProjects } = await getProjectLists(
    identity.userId,
    identity.primaryEmail,
  )

  return (
    <ProjectWorkspace
      ownedProjects={ownedProjects}
      project={project}
      sharedProjects={sharedProjects}
    />
  )
}
