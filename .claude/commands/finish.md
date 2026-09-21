---
description: When the current task is done — review your own changes, then commit and push
---

**This is not an interrupt.** It says what to do _when you have finished_, not _instead of finishing_.

So before anything below: is the task you are working on actually complete? If it is not, say that you are queueing this review, carry on, and finish the work first. Then start here. Never treat this invocation as a reason to stop early, to cut scope, to leave something half-done, or to review and commit a state you already know is intermediate — a commit of unfinished work is the one outcome this command must never produce.

**This covers your own changes only.** Another instance may be working in the same tree at the same time, so a dirty file is not evidence that you touched it. Before reviewing anything, write out the explicit list of files _you_ edited in this session, from your own record of the edits you made — not from `git status`, which shows everyone's work. Everything outside that list is off limits: do not review it, do not fix it, do not improve it in passing, and do not stage it. Read the rest of the tree freely when you need context; just never write to it or commit it.

If a file you touched is also being changed by someone else, or you cannot tell whose a change is, leave it alone and say so instead of guessing.

When the work is genuinely done:

Run a simplification pass over your files: refactoring, reorganisation, duplicate sources of truth, overengineering and dead code.

Then:

1. **Tests for every helper and hook you added or changed.** Always — this command overrides the "only after the user confirms" rule, because invoking it _is_ that confirmation. Global state (stores) is excluded. Make each new test able to fail: break the code it covers, watch it go red, restore.
2. **Logic is kept out of view components.**
3. **No magic numbers or other magic values** — every meaningful value is self-describing and held in a named constant.
4. **Re-read the project guidelines (`CLAUDE.md`) and your memory, and walk your diff against them.** Comments, file and folder structure, imports and barrels, design tokens, component size, bundling traps — whatever applies to what you touched. Say which guidelines you checked and what you found; do not answer "all fine" without naming them.

Do not change how the application behaves. This is reorganising code, not changing behaviour.

Before committing, prove these rather than assuming them:

- The task itself is finished, not parked.
- List every helper and hook file among your changes, name the test file covering each, and say which you wrote in this pass. A missing test blocks the commit.
- Account for every new file you created — a scratch probe either becomes a real test or is deleted.
- List what you deferred during this task, why, and what brings it back (`docs/OPEN_THREADS.md`).
- `manifest.json` version was bumped.

Then run `npm run check` and `npm run build`. Expect failures from the other instance's work in progress: a failure outside your files is not yours to fix, and not a reason to hold your commit — say which failures you are attributing elsewhere and why.

Stage by naming each of your paths explicitly. Never `git add -A`, never `git add .`, never `git commit -a` — each of those sweeps up the other instance's work. After staging, print `git status --short` and confirm every staged path is on your list before going further.

Once that is clean, **commit and push**, following the project's Git rules for the message (written to a file, `git commit -F`, no attribution trailers) and the commit timeout. This invocation is permission for exactly one commit, and it holds for the whole iteration however long the remaining work takes — a queued finish does not expire. If you already committed during this iteration, that permission is spent. Print the commit afterwards.
