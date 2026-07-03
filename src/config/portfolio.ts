import { defaultHomePath } from './product'
import type { ProjectWorkspace } from './navigation'

/** FlowAgent is AI-only; legacy demo navigation removed */
export const isPortfolioMode = true

export const defaultAppHomePath = defaultHomePath

export type ExternalDemoModule = {
  key: string
  repo: string
  title: string
  description: string
  workspaceKey: string
  icon: unknown
  status: 'planned' | 'extracted'
  entryPaths: string[]
}

export const externalDemoModules: ExternalDemoModule[] = []

export const resolveProjectWorkspaces = (
  allWorkspaces: ProjectWorkspace[]
): ProjectWorkspace[] => {
  const aiWorkspace = allWorkspaces.find(
    (workspace) => workspace.key === 'ai-workspace'
  )
  return aiWorkspace ? [aiWorkspace] : allWorkspaces
}
