# Contributing

dam’d is built for one table, by one maintainer working with an AI coding
agent (the [README](README.md#how-its-built) says how). Reports and ideas
are welcome from anyone. Code is welcome by arrangement.

## Reporting something

- **Open an [issue](../../issues/new/choose).** Use **Something's wrong**
  when the app misbehaves, and **A rule reads wrong** when its reading of a
  rule differs from the book's. Cite the page rather than paste the book's
  text.
- **Name the build**: the last line of Settings › About dam’d, such as
  "App build e857f9a, 2026-10-25."
- **An idea** is an issue too, in your own words.
- **A security problem** is never an issue. [SECURITY.md](SECURITY.md) says
  how to report one privately.

## Pull requests, by arrangement

**Start with an issue, and wait for the maintainer to agree before writing
code.** Every change is checked on a phone, on its own preview, before it
merges, and the maintainer looks after whatever merges from then on. So a
pull request that arrives without an agreed issue may be closed, however
good it is. Where an issue is labelled `help wanted`, a pull request is
especially welcome: say in the issue that you're taking it.

A pull request follows the same rules as the maintainer's own work, set out
in [AGENTS.md](AGENTS.md), which governs people here as much as agents:

- **Rules are data, not code.** No game rule is written into the code: the
  app reads it from `data/rules/srd/`. That data is a snapshot synced from
  the maintainer's workspace, and the build checks it against its manifest,
  so a rules correction is an issue, not an edit to `data/`.
- **Nothing from beyond the SRD 5.2.1** enters the repository: no text,
  tables or art from any book.
- **Never invent game content.** Where the SRD is silent, the issue says so
  and the maintainer rules on it.
- **Ask before adding a dependency.** The answer is usually no.
- **`npm run build` and `npm run lint` pass**, and the pull request
  template is filled in.

Contributions are under this repository's [MIT licence](LICENSE).

## Conduct

Everyone here follows the [code of conduct](CODE_OF_CONDUCT.md).
