import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { guardedCommand } from '../src/command.mjs'

const quote = value => "'" + value.replaceAll("'", "'\\''") + "'"
const run = (workspace, preparation, original, env = {}) => spawnSync('sh', ['-c', guardedCommand(workspace, preparation, original)], {
  encoding: 'utf8', env: { ...process.env, ...env }
})
const options = { skip: process.platform === 'win32' }

test('successful preparation runs before the complete original command', options, () => {
  const result = run('/tmp/example', 'printf prepare', 'printf first; printf second')
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, 'preparefirstsecond')
})

test('preparation failure blocks every part of a compound original command', options, () => {
  const result = run('/tmp/example', 'exit 7', 'printf first; printf second')
  assert.equal(result.status, 7, result.stderr)
  assert.equal(result.stdout, '')
})

test('workspace data is quoted literally and cannot inject shell commands', options, () => {
  const root = mkdtempSync(join(tmpdir(), 'preflight-'))
  try {
    const marker = join(root, 'injected')
    const workspace = "a'; touch " + quote(marker) + '; #\n`false` $(false)'
    const result = run(workspace, 'printf "%s" "$PREFLIGHT_WORKSPACE"', 'true')
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout, workspace)
    assert.equal(existsSync(marker), false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('preparation receives workspace context without changing the agent environment', options, () => {
  const result = run('/tmp/workspace', 'printf "%s:" "$PREFLIGHT_WORKSPACE"', 'printf "%s" "$PREFLIGHT_WORKSPACE"', {
    PREFLIGHT_WORKSPACE: 'parent-value'
  })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, '/tmp/workspace:parent-value')
})

test('trailing comments do not swallow the original-command guard', options, () => {
  const result = run('/tmp/example', 'true # preparation comment', 'printf ready # original comment')
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, 'ready')
})
