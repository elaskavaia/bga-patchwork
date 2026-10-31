# TODO

## Studio build warnings (20, build 261031-2033)

Legacy deprecations reported by "Commit & build"; none block the build.

- [ ] Remove deprecated images game_icon.png, game_box.png, publisher.png (use Game Metadata Manager)
- [ ] Delete obsolete version.php
- [ ] Replace patchwork.view.php / patchwork_patchwork.tpl with `bga.gameArea.getElement()` in JS
- [ ] Remove state 1 (return first state id from setupNewGame) and state 99 from states.inc.php
- [ ] Drop `require_once(APP_GAMEMODULE_PATH . 'module/table/table.game.php')` and extend
  `Bga\GameFramework\Table`: patchwork.game.php:19, modules/APP_Extended.php:7, modules/EuroGame.php:6
- [ ] Delete deprecated `getGameName()` in patchwork.game.php:53
- [ ] Replace `gamestate->state()` with `getCurrentMainState`/`getCurrentState`:
  modules/APP_Extended.php:156, 242; modules/EuroGame.php:297
- [ ] Use `$this->bga->playerScore` / `playerScoreAux` instead of SQL updates on player_score /
  player_score_aux in modules/APP_Extended.php:302, 306, 342
- [ ] Convert gameoptions.inc.php to gameoptions.jsonc / gamepreferences.jsonc and stats.inc.php
  to stats.jsonc (via the Studio "Reload ... configuration" buttons)
- [ ] Replace `self::_()` with `clienttranslate`: patchwork.game.php:507, 555, 702;
  modules/APP_Extended.php:92, 121; modules/EuroGame.php:374
- [ ] Remove `this.default_viewport` (patchwork.js:1507), use `game_interface_width.autoscale`
- [ ] Replace `ajaxcall` with `this.bga.actions.performAction`: modules/sharedparent.js:440-487
- [ ] Use `this.bga.userPreferences` instead of preference controls / `this.prefs`:
  patchwork.js:1448-1485
- [ ] Use `this.bga.playerPanels.getScoreCounter` instead of `this.scoreCtrl`
  (modules/sharedparent.js:1661) and `getElement` instead of `player_board_<id>` (patchwork.js:988)
- [ ] Remove deprecated gameinfos keys designer, artist, year, presentation, tags, complexity,
  strategy, luck, diplomacy, is_beta (use Game Metadata Manager)
- [ ] Set `exception_on_warning` to true
