# Credits

dam’d stands on other people's work. This is all of it that we know of; if
something is missing, please open an issue.

## The game

dam’d is an unofficial tool for Dungeons & Dragons. It is not affiliated
with, endorsed or sponsored by Wizards of the Coast. Dungeons & Dragons and
D&D are trademarks of Wizards of the Coast LLC.

It carries the notice Wizards'
[Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy)
asks for, here, in the README and in the app's Settings:

> dam’d is unofficial Fan Content permitted under the Fan Content Policy.
> Not approved/endorsed by Wizards. Portions of the materials used are
> property of Wizards of the Coast. ©Wizards of the Coast LLC.

Its rules come from the System Reference Document 5.2.1, and the app shows
this attribution in Settings, as the licence asks:

> This work includes material from the System Reference Document 5.2.1
> ("SRD 5.2.1") by Wizards of the Coast LLC, available at
> <https://www.dndbeyond.com/srd>. The SRD 5.2.1 is licensed under the
> Creative Commons Attribution 4.0 International License, available at
> <https://creativecommons.org/licenses/by/4.0/legalcode>.

The rules data in `data/rules/srd/` is that material, restructured as data.

Content from books beyond the SRD is never in this repository or on the
site: each player loads it from their own book file.

## Fonts

Each is under the SIL Open Font License 1.1, whose text ships beside each
font in `public/fonts/`.

| Font | Copyright |
|---|---|
| Alegreya Sans | Copyright 2013 The Alegreya Sans Project Authors ([huertatipografica/Alegreya-Sans](https://github.com/huertatipografica/Alegreya-Sans)) |
| Alegreya SC | Copyright 2011 The Alegreya Project Authors ([huertatipografica/Alegreya](https://github.com/huertatipografica/Alegreya)) |
| Caveat | Copyright 2014 The Caveat Project Authors ([googlefonts/caveat](https://github.com/googlefonts/caveat)) |
| Cormorant SC | Copyright 2015 the Cormorant Project Authors ([CatharsisFonts/Cormorant](https://github.com/CatharsisFonts/Cormorant)) |
| Roboto Condensed | Copyright 2011 The Roboto Project Authors ([googlefonts/roboto-classic](https://github.com/googlefonts/roboto-classic)) |

## Software that ships with the app

| Package | Licence | Copyright |
|---|---|---|
| [React](https://react.dev) and React DOM | MIT | Copyright (c) Meta Platforms, Inc. and affiliates |

## Tools that build and check it

None of these ship to players.

| Tool | Licence | By |
|---|---|---|
| [Vite](https://vite.dev) | MIT | VoidZero Inc. and Vite contributors |
| [Vite's React plugin](https://github.com/vitejs/vite-plugin-react) | MIT | Yuxi (Evan) You and Vite contributors |
| [Vitest](https://vitest.dev) | MIT | VoidZero Inc. and Vitest contributors |
| [Oxlint](https://oxc.rs) | MIT | VoidZero Inc. and contributors |
| [TypeScript](https://www.typescriptlang.org) | Apache-2.0 | Microsoft Corporation |
| [Ajv](https://ajv.js.org) and ajv-formats | MIT | Evgeny Poberezkin |
| [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) | MIT | Boris Cherny |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | MIT or Apache-2.0 | Cloudflare |

## Works with

- **[Beyond20](https://github.com/kakaroto/Beyond20)**, by kakaroto, a
  browser extension under GPL-3.0, carries dam’d's rolls into Roll20. dam’d
  talks to it and does not include it.
- **Patterns** for the play view were learned from D&D Beyond's and Roll20's
  character sheets. Neither is affiliated with dam’d.

## The code of conduct

[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) is adapted from the
[Contributor Covenant](https://www.contributor-covenant.org), version 3.0,
stewarded by the Organization for Ethical Source, under CC BY-SA 4.0.

## How it's made

- The code is written by [Claude Code](https://claude.com/claude-code), an
  AI coding agent by Anthropic, at the maintainer's direction.
- The icons were drawn by an AI agent, at the maintainer's direction.
- It is hosted on [Cloudflare Workers](https://workers.cloudflare.com).
