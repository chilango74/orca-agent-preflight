import type { OrcaWorkerApi } from 'orca/worker'
import { guardedCommand } from './command.mjs'

export default function activate(orca: OrcaWorkerApi): void {
  orca.hooks.on('agent.launch.before', async (event, next) => {
    if (event.workspaceKind !== 'worktree' || !event.workspaceId) return next(event)
    const configured = await orca.settings.get('command')
    if (configured === undefined || configured === '') return next(event)
    if (typeof configured !== 'string') return { deny: 'Agent Preflight: preparation command must be text' }
    const preparation = configured.trim()
    if (!preparation) return next(event)

    const { workspaces, truncated } = await orca.host.call('workspace.list', {})
    if (truncated) return { deny: 'Agent Preflight: workspace inventory is incomplete' }
    // Launch hooks use raw repoId::path; the public inventory prefers identity selectors.
    const matches = workspaces.filter(row => row.id === event.workspaceId ||
      (row.kind === 'worktree' && row.projectId && `${row.projectId}::${row.path}` === event.workspaceId))
    if (matches.length !== 1) return { deny: 'Agent Preflight: workspace identity is unavailable or ambiguous' }
    const workspace = matches[0]
    if (workspace.hostId !== 'local') return next(event)
    if (workspace.kind !== 'worktree' || !workspace.path.startsWith('/') || workspace.path.startsWith('//')) {
      return next(event)
    }
    return next({ ...event, command: guardedCommand(workspace.path, preparation, event.command) })
  })
}
