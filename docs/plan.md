# Agent Preflight First Release Implementation Plan

> For agentic workers: use native inline execution and an independent final review.

**Goal:** Publish a configurable preparation guard for Orca terminal launches.
**Architecture:** One hook worker reads one command setting, resolves a local Git
workspace, and wraps the original command with a POSIX preparation subshell.
**Tech Stack:** Build-less TypeScript worker, JavaScript shell formatter, Orca SDK
and Node's built-in test runner; no runtime package dependencies.
**Spec:** design.md

## Constraints and review focus

Empty default, trusted-worker consent, workspace:read and settings:own only.
No private paths, project-specific helpers, secrets or telemetry. Preserve both
raw/public workspace identity contracts, fail closed on incomplete identity,
quote workspace data and guard every part of the original command. Remote and
non-applicable launches stay unchanged. POSIX-shell scope is explicit.

## Task 1: Configurable hook and public release

- [x] SDK tests in src/worker.test.ts and real-shell tests in test/shell.test.mjs
  fail before implementation.
- [x] Implement activate(orca) in src/worker.ts and
  guardedCommand(workspace, preparation, original) in src/command.mjs.
- [x] Run Orca plugin test/validate/check, TypeScript checking and Node shell tests.
- [x] Independent review; address material findings with regression tests.
- [ ] Publish README, MIT license, CI and v0.1.0; add the orca-plugin topic and
  read the actual community-listing status.

## Review and verification

The release candidate passed 12 Orca SDK/real-shell tests on Orca 1.4.261,
TypeScript 6.0.3 checking, and plugin validate/check. Five shell tests also run
independently in Node 24 and in CI. Independent read-only review found no
Critical or Important defects. CI deliberately covers only the shell contract;
the Orca hook/capability suite remains a documented local release check.

The declared minimum Orca 1.4.259 follows the hook/identity API used here;
1.4.261 is the actually tested build. Unknown hosts are passed through, while
incomplete or ambiguous identity is refused. Preparation has normal POSIX exit
semantics and no implicit timeout. Public installation and directory indexing
are verified during publication and recorded in issue #1, not inferred from
these local checks. MIT LICENSE and CONTRIBUTING.md were checked by the author.
