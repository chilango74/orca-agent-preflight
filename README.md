# Agent Preflight for Orca

Run a preparation command **before a terminal agent starts** in a local Git
workspace. If preparation fails, the agent does not start.

Useful for checking dependencies, preparing a development environment, or
running your own project-registration script. No specific helper or package
manager is required. The command is empty by default, so launches stay unchanged
until you configure it.

## Install

Requires Orca **1.4.259 or newer** and a local POSIX launch shell. Tested on Linux;
Windows shell commands, SSH/paired workspaces, folder workspaces, structured
Chat launches and restoration of saved sessions are outside this release.

```sh
orca plugin install chilango74/orca-agent-preflight@v0.1.0 --json
```

Use the Orca CLI for your installation (`orca-ide` on native Linux outside an
Orca terminal). Orca first shows the plugin's requested access and an approval
fingerprint. Review and approve that exact request to install it.

In Orca's plugin settings, set **Agent Preflight → Preparation command**, for
example:

```sh
cd "$PREFLIGHT_WORKSPACE" && ./scripts/prepare-agent.sh
```

`PREFLIGHT_WORKSPACE` is the workspace path, quoted as shell data. The preparation
command inherits the terminal environment and starting directory; explicitly
`cd` when your script expects the workspace root. Its variable and directory
changes are confined to preparation and do not change the agent's environment
or starting directory. Output is visible in the terminal.

Your command must exit nonzero when preparation is not ready. The plugin uses
its normal shell exit status; it does not impose `set -e` or a preparation
timeout. A command that hangs continues waiting until you interrupt it or its
own timeout expires.

## How it works

An `agent.launch.before` hook reads the command setting and resolves the local
workspace. It wraps the original command in this sequence:

```sh
(
  export PREFLIGHT_WORKSPACE='workspace path'
  # your preparation command
) && (
  # the complete original agent command
)
```

Preparation runs in the terminal, **outside Orca's two-second hook deadline**.
A failed preparation blocks every part of a compound original command. Hook
errors, missing/ambiguous workspace identity and incomplete workspace inventory
refuse the launch rather than silently skipping preparation. Remote, unknown-host
and unsupported workspace kinds/paths are left unchanged.

The worker understands both the raw `repoId::path` IDs used by launch hooks and
the identity selectors returned by the public workspace API. A raw ID that is
ambiguous between hosts is refused.

## Access and privacy

This is a `trusted-worker` plugin: Orca runs its code in a Node process with your
user account's access. It requests:

- `workspace:read` to resolve the launch's workspace and host;
- `settings:own` to read its preparation-command setting;
- the `agent.launch.before` hook to guard the launch command.

The plugin has no runtime package dependencies or telemetry. Its code does not
use Orca's secret-store API or make network requests. The preparation command is code you choose and
trust; it runs with your permissions and may have its own effects. Keep credentials
out of the command setting and use your usual environment/credential tooling.

## Disable or remove

```sh
orca plugin disable chilango74.agent-preflight --json
orca plugin uninstall chilango74.agent-preflight --json
```

Existing agents are not interrupted. Disabling removes this guard from future
launches; it does not undo anything your preparation command already did.

## Development

There is no build step or runtime npm install. Orca loads the TypeScript worker
and the small JavaScript command formatter directly.

```sh
node --test test/shell.test.mjs
orca plugin types . --json
orca plugin test . --json
orca plugin validate . --json
orca plugin check . --json
tsc -p .
```

The Orca SDK suite checks real hook-chain/capability behavior with host fixtures;
the Node suite executes generated commands in a real POSIX shell. The latter
also runs in CI. `.orca/` contains generated SDK types and is not committed.
Use an installed TypeScript compiler for the optional typecheck.

See [the design](docs/design.md) and [contribution notes](CONTRIBUTING.md).

## License

[MIT](LICENSE).
