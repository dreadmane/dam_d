# Agent Instructions

This is the code for **d-amp-d**, a character sheet for D&D 2024 (5.5e). It
is a fork of **Crawler Interface**, the Dungeon Crawler Carl character
builder. Its history from before it went public, that app's included, is in
a private archive repository, `dam_d-archive`, because Crawler Interface's
history carries its rulebook data. It keeps that app's shell (the list, the
band, the sheet and its menus, the dice and the Rolls log, Roll20, export
and import), with no DCC rule left in it. It has two looks, the
Adventurer's Journal by default and Classic, and its rules are the SRD
5.2.1's, read from data. Everything except the code lives in the
maintainer's knowledge workspace, a folder of markdown documents outside
this repo, which is not public. On the maintainer's machine, `.env.local`'s
`RULES_DATA_DIR` points into it, at its `domains/dnd-rules/data`. The paths
below are the workspace's:

- **How to work:** the workspace's `AGENTS.md`. It governs here too: rules are
  data, cite the book, never invent game content, ask before adding a
  dependency, and teach the git and deploy steps rather than just running them.
- **Where things stand:** this repo's open issues (`gh issue list`), where
  the app's own work is tracked, and the newest entry in the workspace's
  `log.md`, whose open items are the workspace's handoff. A pull request
  closes the issue it fixes with `Fixes #<n>` in its body.
- **What the app does:** `apps/d-amp-d/spec/d-amp-d-spec.md`, with the
  standing rulings in `apps/d-amp-d/CONTEXT.md`. The spec states only what
  differs from Crawler Interface; for every feature carried as-is,
  `apps/character-builder/spec/character-builder-spec.md` is the behaviour.
- **Its rules:** `domains/dnd-rules/`. Its `data/srd/` is the public tier
  that ships here; `data/books/` never enters this repo or the site.
- **The remote `dcc`** is Crawler Interface's repo. A fix made there can be
  brought over (`git fetch dcc`, then cherry-pick); nothing is ever pushed to
  it from here.

The rules are the workspace's `domains/dnd-rules/`, and the tokens are
d-amp-d's own, in `domains/dnd-design/`.

Read the log entry first. The repo is outside OneDrive because `.git` and
`node_modules` cannot survive OneDrive's Files On-Demand, so the documents
stay there and only code lives here. Do not create a `CLAUDE.md`; Claude Code
reads this file.

## Generated files: never edit by hand

| Path | Made by | Why |
|---|---|---|
| `data/rules/` | `npm run sync-data` | A snapshot of the workspace's `domains/dnd-rules/data/`: its `schemas/` and its public tier, `srd/` (the SRD 5.2.1), with `manifest.json` beside them. Never `books/`, the private tier: a test fails if a `books/` folder or a file not of the `srd` tier is here. Rules are corrected in the workspace and synced; `npm run build` fails if the snapshot and its manifest disagree, or if the integrity check (`scripts/lib/integrity.mjs`, a port of the domain's `validate.mjs`) does |
| `src/rules/types.ts` | `npm run gen-types` (sync runs it) | Types come from the JSON Schemas, because hand-written types drift |
| `data/design/tokens.json` | `npm run sync-tokens` | A snapshot of the workspace's `domains/dnd-design/tokens/tokens.json`, seeded from the `classic` tag's. Tokens are changed there and synced |
| `src/styles/tokens.css` | `npm run sync-tokens` | The tokens as CSS custom properties. A test fails if it is stale, or if any declared contrast pair misses WCAG AA in either theme |
| `src/save/types.ts` | `npm run gen-types` | The save record's types, from the newest `src/save/schemas/roster-v<N>.schema.json`. A test fails if it is stale |

App code reads rules from `data/rules/srd/` and never hardcodes one. Check a
file's `meta.complete` before relying on it as the whole of its topic. Every
file imported into the app ships in the bundle: import a rules file by its
top-level keys, or load it on demand, so the main bundle carries only what a
screen reads.

Styles use token custom properties (`var(--color-accent)`), never a literal
colour, size, or font. A new foreground and background combination needs a
contrast pair added in the workspace's tokens first, or it goes unchecked.
The display fonts are self-hosted in `public/fonts/`, each beside its own
`<font>-OFL.txt` licence, which must ship with it.

## The save record

The save format is defined by `src/save/schemas/roster-v<N>.schema.json`, one
file per `schemaVersion`. Once a newer version exists, the older schema and
its fixtures in `src/save/fixtures/` are frozen: they stand for records
players already have. A new optional field needs no new version; anything
else needs a new schema file, `SCHEMA_VERSION` raised, a migration in
`src/save/migrate.ts`, and a fixture at the old version (spec §4.3).
Components reach storage only through `src/save/app-store.ts`. The
character entity is `kind: "character"`; a Crawler Interface file (its
entities `kind: "crawler"`, also at version 1) is refused on import by name,
never migrated. A character's file ends `.dnd.json`.

A field holding a rules id needs a check where the id can dangle: in
`scripts/lib/integrity.mjs` if a rules file holds it, and in
`src/save/resolve-ids.ts` if a save does (none yet: each check arrives in M1
with the screen that reads its id). A screen showing one marks it
"(unresolved)" when it does not resolve, never shows it bare or as nothing
chosen, because an id is kept, not dropped (spec §4.2).

## The device's own state, and the words

What belongs to the device rather than to a character stays in localStorage,
never in a character's file, so an export carries only the character: the
settings (`src/settings.ts`), the pinned menus and the sheet's order
(`src/components/pins.ts`, `sheet-order.ts`), the inventory's sort, the Rolls
log (`src/rolls/`, under `d-amp-d:rolls`, the last 100 per character), and
the notifications (`src/notify/`, under `d-amp-d:notifications`, the last 50
per character and 50 for the device). Each is parsed tolerantly, and storage
that refuses leaves the app working for the visit.

Where the app speaks, it speaks in the Handbook's register (spec §6.1),
every such line in `src/voice.ts`; never in a label, navigation, validation
or a confirmation, or in a state read mid-fight. Routine reports (an item
added, an import) are plain words in `src/notify/lines.ts`.

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Validates the rules snapshot, runs the tests, type-checks, bundles to `dist/`. Cloudflare runs this, so a failing test stops the deploy |
| `npm test` | Vitest, once. `npm run test:watch` reruns on save |
| `npm run sync-data` | Refreshes `data/rules/` from the workspace's `schemas/` and `srd/` (`RULES_DATA_DIR` in the git-ignored `.env.local`; template in `.env.local.example`), validates, writes the manifest and types; removes anything else in `data/rules/` |
| `npm run sync-tokens` | Refreshes `data/design/tokens.json` from the workspace (`TOKENS_DIR` in `.env.local`), checks its contrast pairs in both themes, regenerates `src/styles/tokens.css`; writes nothing if any check fails |
| `npm run gen-types` | Regenerates both types files; run after changing a save schema |
| `npm run lint` | Oxlint |

`main` deploys to Cloudflare Workers. Work on a branch and merge by pull
request; each branch gets a preview URL.

A bug found while a PR is open is fixed on that same branch: another commit,
a plain `git push`, and the PR and its preview update. After the merge it
gets a new `fix/` branch and its own PR, with a test that fails before the
fix. If production is broken, roll back in the Cloudflare dashboard first.
Details: the workspace's setup guide 5, "When something is wrong".

The user's terminal is Windows PowerShell 5.1, which has no `&&`: give
commands one per line.
