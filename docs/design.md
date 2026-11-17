# Agent Preflight

A user-configured POSIX command prepares a local Git workspace before Orca starts
its terminal agent. An empty setting is a no-op. The preparation command runs in
a subshell with PREFLIGHT_WORKSPACE exported; only success starts the complete
original command in a separate subshell. Agent environment values are preserved.

The agent.launch.before hook performs bounded settings/workspace host calls and
builds the command. It does not execute preparation inside the two-second hook
deadline. Hook errors deny through the manifest. Raw repoId::path launch IDs and
public identity selectors are resolved from the same workspace inventory;
missing, ambiguous or truncated inventory is refused. Remote, unknown-host,
folder, null-workspace and non-POSIX-path launches are left unchanged.

Alternatives: an asynchronous lifecycle event cannot block the original launch;
running preparation inside the hook risks a timeout. A shell guard is the
smallest approach that preserves ordinary command exit semantics without a
background process or agent-specific wrapper. These are implementer choices.

No project-specific registration, dependency installer, secret store, network
request, custom UI, Windows shell syntax, structured-chat launch or saved-session
restore support is included. Orca already provides the setting editor and trust
confirmation. The user supplies and trusts the preparation command. No telemetry.
