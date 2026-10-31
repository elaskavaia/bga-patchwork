# Bug Triage - project config and state

Game-specific configuration and running state for the `game-bug-triage` skill. Read this file at the
start of every triage run.

## Game reference

- **BGA game id:** 1420 (Patchwork)
- **Bug list:** https://boardgamearena.com/bugs?game=1420
- **Single report:** https://boardgamearena.com/bug?id=<REPORT_ID>
- **Studio error log:** https://studio.boardgamearena.com/studioissues?game=patchwork - add
  `&tableId=<TABLE_ID>` for one table, `&id=<ERROR_ID>` for one error.
- Checking whether a player recovered: open `https://boardgamearena.com/tableview?table=<TABLE_ID>`
  as a spectator and read the move log (inside the iframe) for moves after the report time. Both
  load-failure reports on 2026-10-31 were closed this way.

## Rules sources

None in the repo yet: no RULES.md. Until one exists, rules-type reports cannot be judged against
a cited source - record them as open questions, do not answer them.

## Deploy model

No git tags. The live version (gamepanel `version`, `yymmdd-hhmm`, Paris time) is the deploy
time; the last commit before it is live:
`git log -1 --before='<yyyy-mm-dd hh:mm> +0100'` (+0200 in summer). A fix is live if it is an
ancestor of that commit. Fix commits reference `BGA #<id>`.

- 2026-10-31: live version 261028-0058; HEAD fb8bf62 (2026-10-27 19:45 EDT) is live.

## Investigation and tests

Legacy project: no test suite, no package.json. Display/CSS bugs can only be proven by a
screenshot or a studio repro.

## Bug triage last checked

**2026-10-31 13:43 EDT** - bump to `date` at run start after each run.

The Open status sweep has never been run: 92 Open reports, most older than a year.

## Tracked bugs

Internal record (root cause, fix, test) - never put this detail in a public bug comment.

- [x] #240690 (dup #246936) Dark mode: player panel counters unreadable. FIXED (client-side CSS,
  not test-covered): `.player-board` in patchwork.css now sets `color: #000` next to its light
  background override; BGA's dark-mode `--game-bga-player-panel-color` is light gray. Also pins
  `.player-board.roundedboxdisabled` to BGA's light-mode #dac6af, else base-rule skins (americana,
  e10) got a dark disabled panel with black text. Verified in Studio dark mode (localStorage
  `bga-theme=dark`): before/after crops, e10 and pworiginal, normal and disabled (class added via JS).
  Not yet deployed - flip the report to Fixed after deploy.

## Auto errors (no report)

- [x] JS `Cannot read properties of null (reading 'className')`, culprit `onDone` ->
  `isActiveSlot` (modules/sharedparent.js) calling `dojo.hasClass` on a null
  `clientStateArgs.dropTarget`. Same stack in Safari `null is not an object (evaluating
  'n.byId(e)[o]')` (718018) and Firefox `can't access property "className", n.byId(...) is null`
  (738207). Other ids: 702576, 715017, 736608, 702265, 736609, 714428, 726092, 751024, 728547,
  753772. Trigger: fast double-click on Confirm (the first click clears `clientStateArgs`, the
  button stays until the state changes); the board done control is already hidden until a patch
  is placed. FIXED (client-side, not test-covered): `isActiveSlot` returns false when the
  element is missing, and `onDone` ignores clicks with no drop target. Verified in Studio:
  double-click Confirm showed "Illegal patch location", now sends one move with no error; done
  click before placing does nothing; practice mode never offers done. Not yet deployed.
- PHP `The stored UNDO corresponds to another player's turn` - framework undo exception, every
  release (725399, 714828, 703106, 750167: ~300 events, ~250 users). Not investigated.

## Triage run log

- **2026-10-31** - First run, scoped to the last 7 days. #246936 (Italian) translated and set
  Duplicate of #240690. #253535 (French) translated. #253535, #253511, #251966, #251962 set Works
  for me: no game-code errors on their tables (#251966 had one platform
  "Maximum execution time exceeded (mysql)"), and each player kept playing within minutes (Oct 24
  tables ended normal_end; Oct 31 reporters moved right after filing). #240690 left Open, tracked.
  #153880 auto-closed by BGA, skipped. Marker set.
