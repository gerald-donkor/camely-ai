export interface Collaborator {
  email: string
  displayName: string | null
  imageUrl: string | null
}

export interface ProjectOwner {
  email: string | null
  displayName: string
  imageUrl: string | null
}
