import { assert, mockHost, mountWorker, test } from 'orca/testing'
import * as main from './worker'

const command = 'cd "$PREFLIGHT_WORKSPACE" && ./scripts/prepare-agent.sh'
const path = "/tmp/example project's repo"
const local = { id: 'identity:wt2:local:fixture', projectId: 'repo', hostId: 'local',
  kind: 'worktree', name: 'Example', path, branch: 'main' }
const event = { agent: 'codex', workspaceId: `repo::${path}`, workspaceKind: 'worktree' as const,
  command: 'codex --version', env: { KEEP: 'original' } }
const hooks = [{ event: 'agent.launch.before', onError: 'deny' as const }]
const create = (configured: unknown, rows: unknown[] = [local], truncated = false,
  capabilities = ['workspace:read', 'settings:own']) => mountWorker(main, {
    hooks, host: mockHost({ capabilities, settings: configured === undefined ? {} : { command: configured as string },
      results: { 'workspace.list': { workspaces: rows, truncated } } })
  })

test('prepares a local launch using its raw ID and preserves the agent environment', async () => {
  const worker = await create(command)
  try {
    const result = await worker.hooks.fire('agent.launch.before', event)
    assert.equal(result.kind, 'continue')
    if (result.kind !== 'continue') throw new Error('unexpected denial')
    assert.match(result.event.command, /export PREFLIGHT_WORKSPACE=/)
    assert.ok(result.event.command.includes(command))
    assert.match(result.event.command, /\) && \(\ncodex --version\n\)$/)
    assert.deepEqual(result.event.env, event.env)
  } finally { await worker.deactivate() }
})

test('empty, missing and whitespace-only commands do not inspect or change workspaces', async () => {
  for (const configured of ['', undefined, ' \n ']) {
    const worker = await create(configured)
    try {
      assert.deepEqual(await worker.hooks.fire('agent.launch.before', event), { kind: 'continue', event })
      assert.equal(worker.host.callsOf('workspace.list').length, 0)
    } finally { await worker.deactivate() }
  }
})

test('public identity selectors resolve to the same workspace', async () => {
  const worker = await create(command)
  try {
    const result = await worker.hooks.fire('agent.launch.before', { ...event, workspaceId: local.id })
    assert.equal(result.kind, 'continue')
    if (result.kind === 'continue') assert.match(result.event.command, /export PREFLIGHT_WORKSPACE=/)
  } finally { await worker.deactivate() }
})

test('remote, unknown-host, folder and null-workspace launches are unchanged', async () => {
  for (const hostId of ['ssh:example', 'runtime:example', null]) {
    const worker = await create(command, [{ ...local, hostId }])
    try { assert.deepEqual(await worker.hooks.fire('agent.launch.before', event), { kind: 'continue', event }) }
    finally { await worker.deactivate() }
  }
  const worker = await create(command)
  try {
    for (const input of [{ ...event, workspaceKind: 'folder' as const },
      { ...event, workspaceId: null, workspaceKind: null }]) {
      assert.deepEqual(await worker.hooks.fire('agent.launch.before', input), { kind: 'continue', event: input })
    }
  } finally { await worker.deactivate() }
})

test('missing, cross-host ambiguous and incomplete inventory cannot authorize preparation', async () => {
  for (const [rows, truncated] of [[[], false], [[local, { ...local, id: 'identity:wt2:remote:fixture', hostId: 'runtime:example' }], false], [[local], true]] as const) {
    const worker = await create(command, [...rows], truncated)
    try { assert.equal((await worker.hooks.fire('agent.launch.before', event)).kind, 'deny') }
    finally { await worker.deactivate() }
  }
})

test('invalid settings and missing capabilities fail closed', async () => {
  for (const configured of [42, false, null]) {
    const worker = await create(configured)
    try { assert.equal((await worker.hooks.fire('agent.launch.before', event)).kind, 'deny') }
    finally { await worker.deactivate() }
  }
  for (const capabilities of [[], ['settings:own']]) {
    const worker = await create(command, [local], false, capabilities)
    try { assert.equal((await worker.hooks.fire('agent.launch.before', event)).kind, 'deny') }
    finally { await worker.deactivate() }
  }
})

test('non-POSIX local paths are not wrapped in POSIX syntax', async () => {
  for (const workspacePath of ['C:\\example', '//wsl.localhost/Ubuntu/home/example']) {
    const worker = await create(command, [{ ...local, path: workspacePath }])
    const input = { ...event, workspaceId: local.id }
    try { assert.deepEqual(await worker.hooks.fire('agent.launch.before', input), { kind: 'continue', event: input }) }
    finally { await worker.deactivate() }
  }
})
