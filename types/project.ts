export interface Project {
  id: string
  name: string
  slug: string
  access: "owned" | "shared"
}
