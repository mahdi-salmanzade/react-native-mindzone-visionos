## Shared instructions for every T2 task

Read these first, in order:

1. `AGENTS.md` (the "This fork" section).
2. `visionos-port/PLAN.md`.
3. `visionos-port/INVENTORY.md`.
4. Any `visionos-port/requests/*.md` addressed to your task ID.

Follow their rules exactly.

**Scope.** Implement every INVENTORY item whose owner is your task ID and whose class is **apply** or **adapt**. For each item classed **already-upstream** or **obsolete** that you own, spend a minute confirming the classification against the code, and record any you disagree with. If you find work in your owned files that the inventory missed, do it and add it to your report as `NEW-<n>`.

**Porting quality bar.**

- Port the *intent*, not just the text. 0.88 code differs from both forks, so read the surrounding 0.88 code before you change it.
- Where the forks disagree, prefer ReactVision 0.86.4, unless 0.88's code makes the Callstack version the one that fits. Record the choice.
- Every visionOS change must compile out, or be a behaviour-identical no-op, on iOS, macOS and Android.
- Use `#if TARGET_OS_VISION` / `#if !TARGET_OS_VISION` in ObjC/C++ and `#if os(visionOS)` in Swift. Match the reference forks' guard style.
- No drive-by refactors and no reformatting of upstream lines.

**Cross-task edits.** Only edit files you own. If you need a change in another task's file, append it to `visionos-port/requests/<your-task-id>.md` as: target file, exact change (a diff or precise description), and why. Never edit that file yourself.

**Verification.** Run every check that is possible without a full app build, and record each command with its result in your report. A full CocoaPods/Xcode app build is T4's job. Never write "builds" or "works" for something you did not run.

**Report.** Write `visionos-port/reports/<your-task-id>.md` with:

- An item-by-item status table: ID, done/partial/not done, files, notes.
- Deviations from the references, and why.
- `NEW-` items.
- Requests you filed.
- Checks run, with results.
- Open risks.

**Constraints.**

- No git writes of any kind.
- No network access.
- Don't touch `node_modules`. Don't change `yarn.lock`, except where your task explicitly owns a dependency change, and then say so.
- `packages/react-native/package.json` shows a `hermes-compiler` version change made by `yarn install`'s preinstall hook. Leave that line alone; the orchestrator restores it before committing.
