# Security

dam’d is a static site, with no server and no accounts. Every character is
saved in the player's own browser, and leaves it only as a file the player
exports. What could still go wrong is mostly in what the app reads: a file
it imports (a dam’d file, a D&D Beyond PDF, a book file) that runs code, or
damages the characters already saved; or a package it uses with a known
vulnerability, which Dependabot watches for.

## Reporting a vulnerability

**Please don't open an issue.** Report it privately instead: on this
repository's **Security** tab, choose **Report a vulnerability**. Only the
maintainer sees the report, and answers there. Say whether you'd like to be
credited in the fix.

## What's supported

Only the live site, <https://d-amp-d.dreadmane.workers.dev>, built from
`main`. There are no older versions to patch.
