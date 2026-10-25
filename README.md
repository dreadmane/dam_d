# dam’d

An unofficial character sheet for D&D's 2024 rules (fifth edition), built
for one table: each player keeps their own characters in their own browser,
on a desktop at an online game and on a phone at an in-person one.

**Live:** <https://d-amp-d.dreadmane.workers.dev>

dam’d is not affiliated with, endorsed or sponsored by Wizards of the Coast.
Its rules come from the System Reference Document 5.2.1, under the licence
[credited below](#credits).

> dam’d is unofficial Fan Content permitted under the
> [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy).
> Not approved/endorsed by Wizards. Portions of the materials used are
> property of Wizards of the Coast. ©Wizards of the Coast LLC.

## What it does

- **Builds a character level by level**, from the SRD's species,
  backgrounds, classes, subclasses, feats and spells.
- **Plays it at the table:** the sheet opens on your turn, with your
  actions, attacks, spells and resources; dice that roll from the sheet,
  with a log of the session's rolls; conditions, rests and spell slots.
- **Sends rolls to Roll20** through the [Beyond20](https://github.com/kakaroto/Beyond20)
  browser extension.
- **Imports** a character from D&D Beyond's PDF export or from a dam’d file,
  and **exports** each character as a file: until there is sync, that file
  is your backup and your way between devices.
- **Your own books:** content from books you own, beyond the SRD, loads from
  a book file you import on each device. It never enters this repository or
  the site.
- **Two looks:** the Adventurer's Journal, and Classic.

Everything is saved in your browser. There are no accounts and no server.

## How it's built

dam’d is written by an AI coding agent,
[Claude Code](https://claude.com/claude-code), at the maintainer's direction.
Every change goes through a pull request with its own preview, which the
maintainer checks before it merges, on a phone wherever the change shows
on a screen. The agent's commits name it as their co-author.

- **The rules are data, not code.** Each rule lives as structured JSON in
  `data/rules/srd/`, and the app reads it; no rule is written into the code.
  The data is extracted from the SRD with an agent's help. Its entries cite
  their page and section, and say when they are an inference or a ruling
  rather than printed text. Game content is never invented.
- **The icons** were drawn by an AI agent, at the maintainer's direction.
- **The fonts** are open fonts by their designers, [credited below](#credits).

dam’d began as a fork of Crawler Interface, a character builder for the
Dungeon Crawler Carl roleplaying game by the same maintainer, and keeps its
shell. This repository's history starts the day dam’d went public. The
history before it stays private, because Crawler Interface's carries that
game's rulebook data.

## Running it

You need [Node.js](https://nodejs.org) 24.

```sh
npm install
npm run dev        # the app at http://localhost:5173, reloading as you edit
npm test           # the tests (Vitest)
npm run lint       # the linter (Oxlint)
npm run build      # lint, validate the rules data, test, type-check, bundle
```

`npm run build` runs exactly what the host runs before a deploy.

The rules data and the design tokens are snapshots of a separate knowledge
workspace, copied in by `npm run sync-data` and `npm run sync-tokens`. Don't
edit `data/` by hand: the build checks the snapshot against its manifest.
[AGENTS.md](AGENTS.md) lists every generated file and how it's made.

## How work happens

- **Work is tracked as [issues](../../issues)**, labelled `bug`,
  `enhancement`, `question`, `accessibility`, `chore`, `needs-concept` (a
  design first) or `needs-ruling` (waits on a rules reading).
- **Each change is a branch and a pull request.** Cloudflare builds a preview
  of every branch, and checks the build. A pull request is squash-merged
  once its preview has been checked, and `main` deploys to production.
- **Dependabot** watches the packages: a pull request for each known
  vulnerability, and one grouped pull request a month for minor and patch
  updates.
- **[Releases](../../releases)** are named by date (`v2026.10.25`), with
  notes generated from the pull requests they include.
- **Reports and ideas are welcome, and code by arrangement**:
  [CONTRIBUTING.md](CONTRIBUTING.md) says how. Everyone follows the
  [code of conduct](CODE_OF_CONDUCT.md), and a security problem is reported
  privately, as [SECURITY.md](SECURITY.md) says.

[AGENTS.md](AGENTS.md) is the guide for coding agents working here.

## Credits

[CREDITS.md](CREDITS.md) lists every work dam’d stands on: the SRD, the
fonts, the software that ships with it and the tools that build it.

## Licence

The code is under the [MIT licence](LICENSE). Three parts of the repository
keep their own:

- **`data/rules/srd/`** is material from the SRD 5.2.1, under the Creative
  Commons Attribution 4.0 licence, with the attribution in
  [CREDITS.md](CREDITS.md).
- **The fonts** in `public/fonts/` are under the SIL Open Font License 1.1,
  whose text ships beside each.
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** is the Contributor Covenant
  3.0, under Creative Commons Attribution-ShareAlike 4.0.
