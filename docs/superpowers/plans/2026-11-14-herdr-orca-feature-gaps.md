# Orca feature gaps and implementation plan for herdr

Date: 14 November 2026

## Recommendation and scope

Build a task and review workbench inside the herdr desktop app using personal GPUI mods and a durable local helper. Start with isolated task worktrees, reliable task tracking, richer review, and GitHub checks. Extend the existing Feedback companion rather than replacing it. Add scheduling, searchable session history, and usage visibility next. Treat structured chat and an embedded browser as separate investments.

Scope assumption: Orca means [stablyai/orca](https://github.com/stablyai/orca), and the requested gaps are capabilities available in Orca that would improve this herdr setup. This is a source audit and proposed roadmap, not a live certification of every installed feature. Herdr baseline: local `.herdr-hover` checkout, package version 0.1.15, commit `c5a38b6` from 12 November, plus the personal `herdr-preview` addon. Existing hover-focus edits are outside this plan.

The target is **herdr-app + herdr-core (`hc`)**. Herdr TUI uses a different server. Its plugins and third-party orchestrators must be checked for runtime compatibility before reuse.

## What already exists

The largest opportunity is joining the workflow from task creation through review and shipping. Several individual capabilities already exist:

- Persistent terminals, agent status, helper-agent messaging, split panes, SSH machines, and a command API are existing herdr capabilities. Window closure leaves core terminals running; reboot recovery does not preserve an arbitrary running program. [Herdr core](https://herdr.dev/core/), [local app README](../../../.herdr-hover/README.md).
- A shipped worktree mod creates, discovers, opens, and removes Git worktrees, including remote execution. New branches currently start at `HEAD`; the dialog does not implement a task lifecycle or bootstrap recipes. [Worktree source](../../../.herdr-hover/defaults/mods/worktree/main.js).
- The shipped Changes mod lists changes, displays text diffs, and commits. Its commit path runs `git add -A` before committing. Granular staging and review feedback are meaningful additions. [Changes source](../../../.herdr-hover/defaults/mods/changes/main.js).
- The shipped Files mod has a file tree and read-only text editor. File browsing is present; writable editing and rich artifact viewing need additional work. [Files source](../../../.herdr-hover/defaults/mods/files/main.js).
- The personal Feedback addon already captures element/area context and screenshots, dispatches annotation workers, preserves archives, recovers launch uncertainty, and coordinates cooperating workers through file claims. Workers currently operate in the selected project checkout. [Feedback README](../../../herdr-preview/README.md), [contract](../../../herdr-preview/CONTRACT.md).
- Herdr already has iPhone, iPad, and Android clients connecting to herdr-core. A replacement mobile app is unnecessary. Custom desktop mod panels do not automatically become mobile screens. [Herdr mobile](https://herdr.dev/mobile/).
- The [official gallery](https://herdr.dev/gallery/?type=mods) lists GitHub/PR panels, Changes Plus, New Workspace Flow, session history, task scheduling, and provider-usage mods. These are reuse candidates; their names and descriptions do not establish compatibility or reliability in this setup.

## Prioritized gaps

### G1 Task workspaces and repeatable setup

**Priority: first release. Status: partially covered.** Orca connects a task to its worktree, starting ref, tools, linked work, and eventual review. Herdr has the underlying worktree operations. [Orca worktrees](https://orca.dev/docs/model/worktrees).

Build a task composer with project, machine, explicit base ref, branch, agent, prompt, and optional issue link. Resolve and save the base commit once. Give each editing task an isolated worktree by default. Store bootstrap commands, an explicit list of local files to copy, and a separate list of safe caches to share. Do not copy secrets by default or share mutable build outputs across branches. Reserve a preview port per workspace.

The first release should support local tasks and discover external worktrees. Remote setup follows the same contract on the execution host. Archive task records separately from deleting their checkout; retain branches unless branch deletion is explicitly selected. Use a repository identity based on machine and canonical Git common directory, not the repository basename: the current worktree path convention can collide across same-named repositories.

A Git worktree isolates source changes, not processes, credentials, services, databases, or network effects. Keep provider sandbox settings intact and namespace ports and mutable test resources separately.

### G2 Durable tasks and supervised workers

**Priority: first release. Status: primitives and annotation-specific worker pool exist.** Orca documents runs, tasks, attempts, messages, and decision gates. Its orchestration is experimental; documentation says its experimental panel is temporarily unavailable. Match the useful lifecycle rather than promising a fully polished Orca orchestration UI. [Orca orchestration](https://orca.dev/docs/cli/orchestration).

Add a persistent task board, dependencies, bounded concurrency, attempt history, retry, cancellation, explicit questions, and result artifacts. Keep live agent state separate from task outcome. Herdr's `done` means a finished agent that has not been viewed; it can become `idle` on inspection. Neither state proves a task passed its acceptance checks. A new general task must pass recorded verification before reaching Ready for review; completion follows user acceptance or an explicitly configured completion policy.

Reuse the Feedback pool's ownership checks and recovery patterns. Introduce a generic task adapter alongside it; preserve existing annotation behavior and archives. Add a DAG only after independent tasks and retries are reliable.

Dependencies must also describe which code a worker receives. Save accepted result commits, compose required commits on a run integration branch, and create downstream task worktrees from that resolved SHA. Surface integration conflicts as blocked work with an inspectable checkout; never resolve them silently or merge into the user's primary branch automatically. Read-only tasks may depend on an artifact without inheriting code changes.

### G3 Code review and feedback on diffs

**Priority: first release. Status: basic text review exists.** Orca supports scoped diffs, granular staging, image comparison, and line comments delivered to an agent. [Diff viewer](https://orca.dev/docs/review/diff-viewer), [Annotate AI Diff](https://orca.dev/docs/review/annotate-ai-diff).

Extend a personal copy of Changes with staged/unstaged groups, base-commit comparison, file/hunk staging, and review comments. Record comments against an immutable diff snapshot using old/new blob hashes, side, line range, and surrounding text. Re-anchor only when the match is unambiguous; show outdated comments rather than silently moving them. Batch comments into a task file with source excerpts and send once to a chosen agent.

Start with unified text diffs and side-by-side image viewing. Add line staging and a three-way merge editor later. Commit only the intended index; keep Stage all as an explicit action. Recheck the worktree/index fingerprint before applying a generated patch so a concurrently changed diff cannot stage the wrong lines.

### G4 Pull requests and CI

**Priority: first release. Status: missing from inspected shipped mods; community candidates exist.** Orca links hosted reviews and checks to workspaces. [Hosted reviews and Actions](https://orca.dev/docs/review/github).

Start with GitHub through the user's existing `gh` authentication on the execution host. Show PR state, head SHA, review status, checks, and failing log excerpts. Route a selected failure into a task brief. Support explicit push and draft-PR creation with a reviewable title, base, and body. Refresh after each write and distinguish stale/offline data from current state.

Evaluate Redpen and Herdr PRs before writing another read-only panel. Keep provider access behind an adapter so GitLab, Jira, and Linear can be added later. Automatic merge and multi-provider parity are outside the first release.

### G5 Browser and visual feedback continuity

**Priority: early extension. Status: much of the local workflow already exists.** Orca's Design Mode supplies rendered-element context to an agent. The current Chrome companion already provides a similar feedback loop. [Design Mode](https://orca.dev/docs/browser/design-mode).

Add workspace-to-preview ownership, per-worktree server commands/ports, and a reliable link from a comment to its resulting diff and verification. Support several saved workspace sessions while retaining one clear active companion owner. Before generalizing simultaneous workers to isolated worktrees, route each annotation to the correct checkout and preview server.

The requested target is now an actual browser embedded in a herdr pane, matching Orca's in-app annotation experience. This adds a native browser-surface milestone to G5. Keep capture only on annotation save; rendering should be handled directly by the browser engine.

#### Embedded browser implementation

On Windows, host WebView2 inside the herdr window and bind its bounds and visibility to a mod pane. Evaluate the upstream [gpui-webview implementation at herdr's vendored revision](https://raw.githubusercontent.com/longbridge/gpui-kit/1ccf011/crates/webview/src/lib.rs) before implementing the host from scratch. That crate uses Wry and is omitted from this checkout's vendored subset. Its manifest selects GPUI Fast, so it cannot be assumed to link directly against herdr's patched GPUI stack. Adapt the minimal compatible host or use Wry/WebView2 directly after the compatibility spike.

1. **Native surface spike, 2 to 3 days:** display a localhost site in a split pane; prove resizing, DPI, focus, keyboard/IME, tab switching, and pane destruction. Test palette/dialog stacking early. A Windows child browser surface may cover GPUI content in the same bounds; choose explicit occlusion handling or composition hosting if needed before committing to the surface design.
2. **Browser adapter and annotations, 4 to 7 days:** put browser control behind an adapter for navigation, document events, isolated script execution, protocol calls, and screenshot capture. Replace external Chrome launch for embedded sessions. Adapt the existing selection overlay, immutable annotation records, and worker dispatcher. WebView2 exposes DevTools protocol calls/events and browser screenshots, but replacing the existing WebSocket CDP transport requires an explicit bridge. Do not assume the transport or every protocol command is interchangeable.
3. **Pane integration and hardening, 3 to 5 days:** native toolbar, address/history, reload, Annotate, workspace/profile identity, hot reload, renderer recovery, and keyboard traversal. Keep page state while switching tabs, hide inactive surfaces, and destroy only the owned browser when its pane closes. Submitted worker tasks continue independently. Use the browser's capture API for annotation images; the existing GPUI window screenshot cannot be assumed to include a native child browser surface.

The native addition should expose only a browser element and its necessary lifecycle/events. Annotation UX, archives, and agent dispatch stay in the personal addon. Preserve the narrow isolated-world annotation binding; the page must not receive the helper token or a generic agent-launch API. Begin with the current localhost scope and evaluate arbitrary websites separately.

Provisional effort: **9 to 15 engineering days**, approximately 2 to 3 weeks, contingent on the surface spike. This is additional to the companion-based first-release estimate below; if made a first-release requirement, that estimate becomes **25 to 40 engineering days**. Windows is the first target; macOS/Linux need their own host and composition validation. Follow the native maintainer boundary below before implementation.

### G6 Scheduled work

**Priority: second release. Status: annotation queue exists; general schedules are not present in inspected addon/shipped mods.** Orca supports recurring prompts, named timezones, run history, and host selection. [Scheduled automations](https://orca.dev/docs/cli/automations).

Add schedule definitions, Run now, pause/resume, prechecks, a missed-run policy, and per-run task records. The scheduler belongs in an independent helper process on the execution host. It must continue after a panel or app closes. Use Windows Task Scheduler for optional per-user startup here; add launchd/systemd packaging when those platforms are supported.

Claim each occurrence using a unique `(scheduleId, plannedAtUTC)` key. Reconcile unknown launches instead of replaying them. Set overlap policy explicitly; default to skipping an occurrence when its prior run remains active. Store an IANA timezone and test daylight-saving transitions even though the current user timezone, Asia/Bangkok, does not observe DST.

### G7 Session history and intentional resume

**Priority: second release. Status: terminal persistence exists; structured history is not in the inspected shipped mods.** Orca exposes session history and provider-specific resumability. [Session history](https://orca.dev/docs/agents/session-history).

Index the workbench's prompts, attempts, outputs, files, and verification first. Add read-only imports of known provider transcript formats using versioned adapters. Store provider session IDs independently of terminal addresses and task IDs. Resume only through a provider capability that has been verified for that installed version; otherwise offer Open terminal or Start fresh. Clearly distinguish reconnecting to a live terminal, resuming provider context, and recreating a shell after reboot.

### G8 Usage and account visibility

**Priority: second release. Status: community candidates exist; no provider quota surface in inspected shipped mods.** Orca exposes provider-specific limits and reset windows. [Usage tracking](https://orca.dev/docs/agents/usage-tracking).

Start with Claude and Codex usage adapters using supported local/provider data. Include source, account identity, measurement window, and last-refresh time. Keep token estimates separate from subscription limits and monetary cost. An unsupported or failed measurement displays Unavailable, never zero. Evaluate existing usage mods before implementation. Add account switching only after isolated provider profiles and credential handling have been validated; never rewrite a user's active credentials while workers are running.

### G9 Writable editing and rich artifacts

**Priority: staged extension. Status: read-only code viewing exists.** Orca includes an editor and previews for generated documents and media. [Rich viewers](https://orca.dev/docs/editing/viewers).

Use the native editor component for small edits if its installed API supports the needed change events. Save with the existing compare-and-swap `writeTextFile` API, preserving BOM/line endings and detecting external edits. Initially open large or binary files in the user's chosen app. Add Markdown and image panels before PDF or HTML rendering. Rich HTML/Monaco integration cannot simply be pasted into a GPUI mod.

### G10 Structured chat

**Priority: separate later milestone. Status: community chat surfaces exist; provider fidelity needs investigation.** Orca has structured chat for supported provider/host combinations and terminal fallback for others. [Native chat](https://orca.dev/docs/agents/native-chat).

A prompt box that writes into a terminal is not equivalent to structured chat. First prove one supported provider protocol end to end: streaming, tool calls, permission requests, attachments, cancellation, session resume, and failure recovery. Preserve the provider's permission semantics. Then build a GPUI transcript/composer and add a second provider. Do not infer structured state by scraping ANSI terminal output or promise lossless chat/terminal switching without provider support.

### G11 Computer use and cloud provisioning

**Priority: later, evidence driven.** Orca also documents [computer use](https://orca.dev/docs/cli/computer-use) and per-workspace remote environments. Generic computer control, simulators, and provisioning need separate OS/runtime integrations. The current companion is scoped to localhost web feedback and is not generic desktop automation. Keep these outside the initial plan. Reuse existing SSH machines and herdr mobile connectivity first.

## Proposed architecture

```text
Personal herdr layout
  task board | agent terminals | changes and review | PR and checks
                                  |
                    versioned native mod client
                                  |
              workbench helper on the execution host
       task store | attempts | scheduler | event stream | artifacts
              /                |                  \
      hc adapter          Git / gh adapter      Feedback adapter
  terminals and status   worktrees and review    existing Chrome companion
```

Keep process lifetime, terminal state, machine connection, and pane layout in existing herdr APIs. Keep task metadata, review threads, schedules, and provider adapters in the addon. A mod's persisted `shared()` state is appropriate for presentation preferences and selected task IDs, not a scheduler's sole durable store.

Create a sibling `herdr-workbench/` package. Do not make the feedback helper become a scheduler by removing its existing idle-exit behavior; it currently has an intentional browser/annotation lifecycle. Start the workbench service independently, then connect the existing Feedback dispatcher through an adapter. One service owns mutations to its task database; all mods and the CLI are clients.

Proposed module boundaries:

- `mod/tasks/`, `mod/review/`, `mod/checks/`, `mod/history/`: GPUI panels with a shared versioned client.
- `runtime/store.mjs`, `tasks.mjs`, `attempts.mjs`, `scheduler.mjs`, `events.mjs`: durable domain state and transitions.
- `adapters/hc.mjs`, `git.mjs`, `github.mjs`, `feedback.mjs`, `providers/`: external contracts and capability detection.
- `cli/main.mjs`: JSON commands backed by the same service operations as the panels.
- `tests/`: transition, fault recovery, Git fixture, and adapter contract tests.
- `Install-Workbench.ps1`, `Uninstall-Workbench.ps1`: owned installation, dry-run, backup, data retention, and personal-layout registration.

Use SQLite transactions for task state, launch reservations, schedules, and event cursors. Phase 0 must prove a supported SQLite binding on the chosen Node runtime and all packaged targets; the addon's current Node 22+ contract alone does not guarantee a specific built-in SQLite API. Pin the validated runtime/binding and record the dependency before coding persistence. Keep screenshots and large outputs as immutable files addressed by IDs/hashes. Existing annotation JSON remains readable and is not migrated destructively.

### Data and state contracts

- **Project:** stable ID, machine ID, canonical Git common directory, remote URL, and setup recipe.
- **Workspace:** project, canonical path, branch, requested base ref, resolved base SHA, preview server/port, and lifecycle.
- **Task:** objective, acceptance checks, dependencies, workspace, result references, status, version, and timestamps.
- **Attempt:** task ID, attempt ID, operation ID, launch nonce/name, host, terminal address, provider argv/session ID, turn baseline, outcome, and verification.
- **Review:** diff snapshot hashes, file path, side/range, context, thread status, and delivery receipt.
- **Schedule:** timezone/rule, host/project, concurrency policy, next occurrence, and unique run claims.
- **Event:** monotonic sequence, entity/version, operation ID, type, and timestamp; clients reconnect from a cursor or request a fresh snapshot.

Task flow: `draft -> queued -> running -> verifying -> ready_for_review -> completed`. `blocked`, `failed`, and `canceled` are explicit branches. Approval, test success, PR checks, and provider activity are independent facts. A retry creates a new attempt; stale completion from an earlier attempt cannot complete the new one. Dependency cycles are rejected and downstream tasks wait for accepted prerequisites.

### Reliability requirements

1. Persist launch intent before calling `hc`; use a stable unique name/nonce to reconcile a lost response. Unknown status holds its capacity reservation until reconciled.
2. Use `(machine, terminal address, launch identity, task attempt)` for ownership. Short addresses such as `t7` are not globally unique and can become stale across runtime resets.
3. Accept completion only for the active attempt and current turn. Capture artifacts and run acceptance checks; terminal idleness alone is insufficient.
4. Persist task mutation and an outbox event together. Delivery is replayable and consumers deduplicate. Do not claim exactly-once execution of external programs.
5. Treat disconnects as unknown, preserve task records, and reconnect without launching another worker. On event sequence gaps, reload the authoritative snapshot.
6. Never close arbitrary user terminals during cleanup. Revalidate ownership immediately before closing an owned worker and retain failed/uncertain attempts for inspection.
7. Keep worktree deletion separate from task archival. Refuse automatic deletion while a tracked worker/server owns the checkout or changes need review.
8. Expose only authenticated local service APIs. Reuse the companion's origin checks and narrow browser bindings; webpage context must never gain agent-launch or filesystem capabilities.
9. Run Git and provider CLIs with argument arrays on the correct host. Preserve permissions and per-launch configuration; do not apply global provider changes.
10. Use `hc` events if supported by the installed protocol. Feature-probe first, reconcile snapshots after reconnect, and use bounded polling when necessary. The app source already consumes `events.subscribe`; that does not establish an identical CLI command shape.
11. Bind verification to the exact commit and working-tree fingerprint under review. Further edits invalidate that verification. Recheck it before accepting or shipping the task.
12. Version the database schema, take a backup before migration, and reject unsupported newer schemas. Roll back owned runtime files independently of user task data.

### Proposed agent API

These are new workbench commands, not commands that currently ship with herdr:

```text
workbench task create --spec-file <path> --project <id> --json
workbench task start <task-id> --json
workbench task show <task-id> --json
workbench task retry <task-id> --json
workbench task cancel <task-id> --json
workbench review send <review-id> --agent <address> --json
workbench schedule run <schedule-id> --json
workbench events --after <sequence> --json
```

The spec supplies the task's workspace/base, agent, and acceptance checks as structured data. Write bounded task briefs to files instead of interpolating arbitrary prompts into shell commands. Return an operation receipt immediately for long-running work, and expose progress/recovery through that receipt. Keep these operations in the helper instead of expanding herdr's shared native command registry.

## Delivery sequence and effort

Estimates are planning ranges for one engineer familiar with the existing addon, including focused tests and Windows verification. They are not measured delivery commitments. Team parallelism can reduce calendar time, but the persistence/ownership contracts remain a dependency.

### Phase 0 Baseline and reuse decisions

**2 to 3 engineering days.** Record app/core/protocol/Node/provider versions. Probe native editor, mod command routing, event subscriptions, and SQLite packaging in a scratch home. Review candidate gallery mod source, license, runtime compatibility, failure handling, and upkeep. Compare the current runtime to third-party orchestration tools before adopting one: for example, [orchestratr's introduction](https://www.orchestratr.dev/docs) describes `herdr integration` and its own dedicated herdr session, so it is not yet established as a drop-in for this `hc` setup.

Deliverables: capability report, chosen reusable components, database/runtime decision, fixture core adapter, and migration boundaries. Exit when a fake task can persist and recover its launch receipt without affecting the real app.

### Phase 1 Isolated tasks

**5 to 8 days, after Phase 0.** Implement store, service lifetime, CLI/client, task composer, explicit base resolution, worktree setup, ownership, and a board. Start with two independent tasks and a global concurrency cap; add dependencies after the linear path works. Keep annotation dispatch on its existing adapter.

Acceptance: two agents edit the same source filename in different worktrees; app closure leaves them running; helper restart recovers them without duplicate launch; a failed bootstrap remains retryable with logs; base branch movement does not change the saved comparison SHA. Verify same-name repos, paths with spaces/Unicode, existing branches, detached HEAD, submodules, and canceled creation.

### Phase 2 Review and revision loop

**5 to 8 days, after Phase 1.** Personal Changes extension, staging controls, pinned comments, review batches, task verification output, and explicit acceptance. Provide a side-by-side image MVP and link existing visual annotations to task results.

Acceptance: stage one hunk without including unrelated edits; comment on a range; send it once; receive a revision; show the updated diff and preserved review history. A stale hunk is rejected. A shifted ambiguous comment is marked outdated. A worker's successful turn cannot automatically accept the task.

### Phase 3 Shipping and preview ownership

**4 to 6 days, after Phase 2.** Integrate or adapt a GitHub checks panel, push/draft-PR flow, branch/head-SHA binding, failure-to-task handoff, and worktree-specific dev-server/preview ownership. Keep the Chrome companion as the browser surface.

Acceptance: publish a draft PR through an explicit action; show checks for the correct SHA; turn a failed check into a scoped revision task; open two worktree previews without port/profile crossover. Offline/auth errors preserve task state and never target another repository.

**First release total: 16 to 25 engineering days**, approximately 4 to 6 calendar weeks with integration/review buffer. The release covers G1-G4 and the first part of G5. Full chat, arbitrary desktop control, and every provider are not included.

### Phase 4 Scheduling and recovery

**4 to 7 additional days.** Independent service startup, timezone rules, occurrence claims, prechecks, overlap/missed-run policy, and run history. Integrate a gallery scheduler only if it satisfies these lifetime and recovery requirements.

Acceptance: a run starts while the app is closed; restarting the scheduler at its due time cannot double-launch; offline remote targets do not replay old runs without the configured grace policy; DST cases and cancellation are deterministic.

### Phase 5 History usage and artifacts

**5 to 8 additional days.** Own-task search first, then two provider transcript/quota adapters, manual resume, Markdown/images, and writable small-file editing if the native editor probe passed. Support provider-specific unavailable states and stale-data timestamps.

Acceptance: locate and inspect a closed task; resume a known session without confusing terminal identity; an unsupported log format leaves raw artifacts accessible; an unavailable quota is not shown as zero; concurrent external edits cannot be overwritten silently.

### Phase 6 Remote execution parity

**4 to 7 additional days.** Deploy the helper and state store on one SSH host. Route worktree setup, task files, Git/GitHub operations, provider commands, and schedules there. Fetch bounded artifacts for local review. Reuse herdr's machine connections rather than exposing a public addon server.

Acceptance: disconnect/reconnect preserves one attempt; remote file paths never resolve against the local disk; a phone can inspect and steer the underlying agent through existing herdr mobile. A mobile task-board UI would require its own client integration and is not implied by this phase.

**Expanded workbench total: 29 to 47 engineering days**, approximately 7 to 11 weeks with buffer for one engineer. This closes the selected workflow gaps; it is not total Orca parity.

### Later structured chat and deeper IDE features

Budget **2 to 3 days for a provider-protocol feasibility spike**, then provisionally **15 to 25 additional days** for a two-provider chat MVP if stable interfaces exist. Re-estimate after the spike. Full editor/LSP support, generic computer use, an embedded browser, cloud VM recipes, simulators, multi-account hot swapping, and mobile task-board parity each need separate discovery and estimates.

## First reviewable changes

1. Capability probes, mock `hc` fixtures, and addon skeleton; no runtime changes.
2. Transactional task store, operation receipts, service ownership, CLI, and recovery tests.
3. Worktree lifecycle and task composer with explicit base and setup logs.
4. Worker adapter, concurrency, verification, task board, and ownership-safe cleanup.
5. Changes extension with staging and snapshot-bound review batches.
6. GitHub adapter and PR/checks panel with head-SHA validation.
7. Preview-server/worktree binding and Feedback task links.
8. Scheduling/startup, then history/usage/artifacts, then remote parity as separate increments.

Each increment must leave the installed Feedback addon usable. Keep legacy archives and adapter contracts, gate new workbench behavior, and preserve personal layouts. Installation backs up owned files, validates mods in a scratch `HERDR_APP_HOME`, then registers a personal layout. Uninstall removes owned runtime files and startup registration while retaining data unless removal is explicitly requested.

## Validation and release gates

- Run the existing `herdr-preview` test suite before and after adapter changes. Preserve its completed-turn, launch-recovery, annotation archive, origin-isolation, and ownership checks.
- Test task/store transitions and inject failures after reservation, after external launch, before receipt save, during event delivery, and during cleanup. Verify convergence without duplicate workers or accepting stale results.
- Use real temporary Git repositories for staged/unstaged changes, renamed/binary files, conflicts, externally moved branches, worktrees/submodules, and deletion refusal. Assert resulting index/worktree contents.
- Test scheduler rules using an injected clock, including DST gaps/overlaps, missed-run grace, overlapping runs, unavailable hosts, and duplicate service startup.
- Run `herdr-app check` for every changed mod and inspect it in an isolated Windows app home. A mod load check does not execute deferred UI states or establish layout quality.
- Test keyboard creation, switching, commenting, retry, and error recovery. Show where each task is running and make every action target an explicit task/workspace.
- Proposed performance targets: an idle workbench creates no screenshots and spawns no repeated Git/provider processes; inactive panels unsubscribe; active status updates are coalesced; on a documented local fixture with 100 tasks and 8 active workers, target board interaction under 100 ms and visible status updates within 2 seconds. Measure these targets before accepting them as guarantees.
- Run an actual local end-to-end scenario: create two isolated tasks, restart the helper, review one task, request revisions, stage selected changes, create a draft PR, observe checks, and archive without losing work. Remote parity gets the same scenario with a disconnect in the middle.

## Native changes and maintainer boundary

The repository's [AGENTS.md](../../../.herdr-hover/AGENTS.md) keeps application/model/layout/shared API growth small and requires discussing such additions with Can before implementation. The initial workbench is designed to fit existing mod APIs, `exec`, `hc`, local files, and a helper, so no core expansion is assumed.

If the editor, file attachments, streaming, or later browser/chat work truly requires a new native capability, first document why the app must act on it, only the app can observe it, and mods cannot implement it correctly. Propose the smallest primitive and obtain the maintainer decision before touching that shared boundary. Native additions must update agent-facing documentation and be checked on their real target OS. This is a future contribution constraint, not a reason to delay the addon roadmap.

## Definition of a successful first release

A user can create two isolated coding tasks, let them run while herdr is closed, recover after a helper restart, understand which task needs attention, review and comment on the exact diff, request revisions, stage only intended changes, and create a draft PR with current check status. Every task retains its prompt, ownership, output, verification, and review trail. Existing Feedback users keep their current workflow.
