# Contributing

Keep the plugin small and independent of particular agents, project layouts,
helper scripts and package managers. Bug reports should include the Orca
version, launch surface, shell, workspace kind/host and a minimal preparation
command. Remove credentials and private paths from reports.

For behavior changes, add a failing regression before changing implementation.
Run the checks in README.md. Workspace fixtures must distinguish raw launch IDs
from public identity selectors, enforce real host capabilities, and preserve
host ambiguity. Do not replace SDK tests with an always-permissive host mock.

Community releases are immutable: bump the manifest version and create a new
`vX.Y.Z` tag. Never move an existing version tag to different bytes. Validate the
committed release with Orca before tagging. The repository's `orca-plugin` topic
allows the community directory to discover version tags; do not submit a
third-party plugin to Orca's official-plugin repository.
