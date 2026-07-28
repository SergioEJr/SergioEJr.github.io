# docs/ — historical records, not current documentation

Everything under this directory is a **dated snapshot of work already done**:

- `superpowers/specs/` — the design agreed before a piece of work
- `superpowers/plans/` — the step-by-step implementation plan for it
- `design/` — one-off design explorations

## Read these for intent, never for current paths

They are deliberately **not** kept in sync with the codebase. A plan that says
"modify `src/pages/blog/index.astro`" was accurate the day it was written and is
a truthful record of what happened; rewriting it to say `journal/` would falsify
that. So:

- **Do not "fix" file paths in these documents.** They are allowed to be stale.
- **Do not trust a path here without checking it exists.** Roughly 19 of these
  files name a file, route, or component that has since been renamed or deleted.
- Verify against the tree (or `AGENTS.md`) before acting on anything here.

The big one is the 2026-07-28 rename — `/publications/` → `/research/`,
`/blog/` → `/journal/`, `src/content/blog/` → `src/content/journal/`,
`src/assets/blog/` → `src/assets/journal/`, the `blog` collection → `journal`,
plus new post slugs and the deletion of the `/tags/<tag>` pages and
`JournalPost.astro`. **`AGENTS.md` holds the full old → new mapping**; start
there when something in here doesn't resolve.

Commit messages older than that date have the same property, for the same
reason.
