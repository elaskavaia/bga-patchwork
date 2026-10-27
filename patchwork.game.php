<?php

/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * patchwork implementation : © Alena Laskavaia <laskava@gmail.com>
 * 
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 * 
 * patchwork.game.php
 *
 * This is the main file for your game logic.
 *
 * In this PHP file, you are going to defines the rules of the game.
 *
 */
require_once(APP_GAMEMODULE_PATH . 'module/table/table.game.php');
require_once('modules/tokens.php');
require_once('modules/EuroGame.php');
require_once('modules/PwMatrix.php');

define("MAX_AUTO_TURNS", 12);

class patchwork extends EuroGame
{

    function __construct()
    {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        self::initGameStateLabels(
            array(
                "end_of_game" => 10,
                "patchone_trig" => 11,
                "var_auto_count" => 12,
                //      ...
                "theme_variant" => 100,
                //    "my_second_game_variant" => 101,
                //      ...
            )
        );
        $this->tokens = new Tokens($this);
        $this->matrix = new PwMatrix($this);
    }

    protected function getGameName()
    {
        // Used for translations and stuff. Please do not modify.
        return "patchwork";
    }

    /*
     * setupNewGame:
     *
     * This method is called only once, when a new game is launched.
     * In this method, you must setup the game according to the game rules, so that
     * the game is ready to be played.
     */
    protected function setupNewGame($players, $options = array())
    {
        /**
         * ********** Start the game initialization ****
         */
        try {
            $this->initPlayers($players);
            $this->activeNextPlayer(); // just in case so its not 0
            $this->initStats();
            // Setup the initial game situation here
            $this->initTables();
            // begging of the turn for active player
            $player_id = $this->getActivePlayerId();
            $this->incStat(1, 'turns_number', $player_id);
            $this->incStat(1, 'turns_number');
            $this->setGameStateValue("var_auto_count", 0);
        } catch (Exception $e) {
            // logging does not actually work in game init :(
            $this->error("Fatal error while creating game");
            $this->dump('err', $e);
        }
        /**
         * ********** End of the game initialization ****
         */
    }

    protected function getDefaultPlayerColors($gameinfos)
    {
        if ($this->isAmericana() || $this->isFolklore())
            return ["ff0000", "0000ff"];
        else if ($this->isHalloween())
            return ["982fff"/* Purple*/,  "f07f16" /* Orange */];
        else if ($this->isAnn10())
            return ["ff0000", "008000"];
        else
            return ["ffa500", "008000"];
    }

    function initTables()
    {
        $this->setGameStateInitialValue("end_of_game", 0);
        $this->setGameStateValue("patchone_trig", 0);

        //srand(null);// XXX!
        $players = $this->loadPlayersBasicInfos();
        $num = $this->getPlayersNumber();
        // neutral token
        $this->tokens->createToken("token_neutral", "limbo", 0);
        // special tile
        $this->tokens->createToken("tile_special7x7", "mainboard", 0);
        // button supply
        $this->tokens->createTokensPack("pbutton_{INDEX}", "supply_buttons", 50, 0);
        // single patches  
        $field = 'patch';
        //         if ($this->isOriginal())
        //             $field = 'patch_o';
        $patch_tt = $this->mtCollectWithField($field);
        foreach ($patch_tt as $i => $tt) {
            $this->tokens->createToken("patch_0_$i", $tt, 0);
        }


        // patches 
        $patches = $this->tokens->createTokensPack("patch_{INDEX}", "limbo", 33, 1);
        shuffle($patches);
        $i = 0;
        $this->tokens->moveToken('patch_1', "market", $i);
        $i++;
        $this->tokens->moveToken('token_neutral', "market", $i);
        $i++;
        foreach ($patches as $patch) {
            if ($patch !== "patch_1") {
                $this->tokens->moveToken($patch, "market", $i);
                $i++;
            }
        }


        foreach ($players as $player_id => $info) {
            $color = $info['player_color'];
            $no = $info['player_no'];
            $this->tokens->createToken("timemarker_$color", "timetracker_0", $num - $no);
            $somebuts = $this->tokens->getTokensOnTop(5, "supply_buttons");
            $keys = $this->tokens->toTokenKeyList($somebuts);
            $this->tokens->moveTokens($keys, "buttons_$color");
        }
    }

    function debug_initTables()
    {
        $this->tokens->deleteAll();
        $this->initTables();
        $newGameDatas = $this->getAllTableDatas();
        self::notifyAllPlayers('resetInterfaceWithAllDatas', '', $newGameDatas);
        $this->debugConsole("ok");
    }

    function debug_getTokens($type, $location = null, $state = null, $order_by = null)
    {
        return $this->tokens->getTokensOfTypeInLocation($type, $location, $state, $order_by);
    }

    function debug_occup()
    {
        $player_id = $this->getCurrentPlayerId();
        $color = $this->getPlayerColor($player_id);
        $occupdata = $this->arg_occupancyData($color);
        $occupancy = $this->matrix->occupancyMatrix($occupdata);
        $pic = $this->matrix->dumpMatrix($occupancy, 'occup', true);
        $rows = explode("\n", $pic);

        $has1 = $this->matrix->hasfilled($occupancy, 1);
        $has3 = $this->matrix->hasfilled($occupancy, 3);
        $has7 = $this->matrix->hasfilled($occupancy, 7);
        $this->debugConsole("occup", [
            'data' => $occupdata,
            'matrix' => $rows,
            'has7' => $has7,
            'has3' => $has3,
            'has1' => $has1
        ]);
    }

    function debug_q()
    {
        $current = $this->getCurrentPlayerId();

        // $players_basic = $this->loadPlayersBasicInfos();
        // foreach ($players_basic as $player_id => $player_info) {
        //     $color = $player_info['player_color'];
        //     $this->saction_PayButtons(5, $player_id);
        // }
        // $patches = ['patch_20', 'patch_29', 'patch_17'];
        // for ($i = 2; $i < 5; $i++) {
        //     $toks = $this->tokens->getTokensOfTypeInLocation("patch", "market", $i);
        //     $this->userAssertTrue("toks " . toJson($toks), count($toks) == 1);
        //     $prev = array_shift($toks);
        //     $this->tokens->moveToken($prev["key"], 'limbo', $i);
        //     $this->tokens->moveToken($patches[$i - 2], 'market', $i);
        // }
    for ($i = 2; $i < 10; $i++) {
            $toks = $this->tokens->getTokensOfTypeInLocation("patch", "market", $i);

            $prev = array_shift($toks);
            if (!$prev) continue;
            $this->tokens->moveToken($prev["key"], 'limbo', $i);
        }
        $newGameDatas = $this->getAllTableDatas();
        self::notifyAllPlayers('resetInterfaceWithAllDatas', '', $newGameDatas);
    }

    /*
     * getAllDatas:
     *
     * Gather all informations about current game situation (visible by the current player).
     *
     * The method is called each time the game interface is displayed to a player, ie:
     * _ when the game starts
     * _ when a player refreshes the game page (F5)
     */
    protected function getAllDatas()
    {
        $this->adjustedMaterial();
        //$current_player_id = self::getCurrentPlayerId(); // !! We must only return informations visible by this player !!
        foreach ($this->token_types as $id => &$info) {
            if (startsWith($id, 'patch')) {
                $mask = $info['mask'];
                // figure out where to put sticker 2 normal sticker,3 rotated to 90deg sticker

                $mask = preg_replace('/11/', '21', $mask, 1);
                if (strpos($mask, '2') === false) {
                    $mask = preg_replace('/1:/', '3:', $mask, 1);
                }
                if (strpos($mask, '3') === false) {
                    $mask = preg_replace('/1$/', '3', $mask, 1);
                }
                if (strpos($mask, '3') === false) {
                    $mask = preg_replace('/1/', '3', $mask, 1);
                }
                $matrix = $this->matrix->pieceMatrix($mask);
                if ($info['income']) {
                    $coords = $this->matrix->valueCoords($matrix, 8);
                    $info['bcoords'] = $coords;
                }
                // first value of coords of 2 or 3 if 2 not found
                $info['lcoords'] = ($this->matrix->valueCoords($matrix, 2) + $this->matrix->valueCoords($matrix, 3))[0];
            }
        }
        $result = parent::getAllDatas();
        $players_basic = $this->loadPlayersBasicInfos();
        foreach ($players_basic as $player_info) {
            $color = $player_info['player_color'];
            $occupancy = $this->getOccupancyMatrix($color);
            $unoccup_count = $this->getOccupancyEmpty($occupancy);
            $this->setCounter($result['counters'], "empties_${color}_counter", $unoccup_count);
            $this->setCounter($result['counters'], "income_${color}_counter", $this->getCurrentIncome($player_info['player_id']));
        }
        //$result ['materials'] = $this->materials;
        $result['variants'] = [];
        $result['variants']['theme_variant'] = $this->getGameStateValue('theme_variant');

        return $result;
    }

    /*
     * getGameProgression:
     *
     * Compute and return the current game progression.
     * The number returned must be an integer beween 0 (=the game just started) and
     * 100 (= the game is finished or almost finished).
     *
     * This method is called each time we are in a game state with the "updateGameProgression" property set to true
     * (see states.inc.php)
     */
    function getGameProgression()
    {
        $players = $this->loadPlayersBasicInfos();

        $diff = 0;
        $boardMax = $this->getMaxTime();
        $oneFinished = false;
        foreach ($players as $player_id => $info) {
            $curtime = $this->dbGetTime($player_id);
            if ($curtime >= $boardMax) $oneFinished = true;
            $diff += $curtime;
        }

        $res =  ($diff / 2 / $boardMax) * 100;
        if ($res < 100 && $oneFinished) return 99;
        return $res;
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////   

    function getMaxTime()
    {
        return 53;
    }

    function isAmericana()
    {
        $variant = $this->getGameStateValue("theme_variant");
        return $variant == 0;
    }

    function isOriginal()
    {
        $variant = $this->getGameStateValue("theme_variant");
        return $variant == 1;
    }

    function isHalloween()
    {
        $variant = $this->getGameStateValue("theme_variant");
        return $variant == 2;
    }

    function isFolklore()
    {
        $variant = $this->getGameStateValue("theme_variant");
        return $variant == 3;
    }
    function isAnn10()
    {
        $variant = $this->getGameStateValue("theme_variant");
        return $variant == 4;
    }

    function isAutoAdvanceOn($player_id)
    {
        $pref = (int) $this->userPreferences->get($player_id, 103);
        return $pref !== 0;
    }

    function adjustedMaterial()
    {
        if ($this->token_types_adjusted)
            return $this->token_types;
        $this->token_types_adjusted = true;
        $theme = $this->getGameStateValue("theme_variant");
        $keys = array_keys($this->token_types);
        foreach ($keys as $key) {
            $vars = explode('@', $key, 2);
            if (count($vars) <= 1)
                continue;
            $value = $this->token_types[$key];
            unset($this->token_types[$key]); // remove keys with @
            $primary = $vars[0];
            $variant = $vars[1];
            // if variant matches
            $variant = preg_replace("/t${theme}/", "", $variant, 1);
            if ($variant !== '') {
                continue;
            }
            // override existing value
            $this->token_types[$primary] = $value;
        }
        // $this->notifyAllPlayers('log', 'see log', $this->token_types);
        return $this->token_types;
    }

    function dbGetPlayerTimePosition($player_id, $includeState = false)
    {
        $color = $this->getPlayerColor($player_id);
        $marker = "timemarker_$color";
        $info = $this->tokens->getTokenInfo($marker);
        $this->systemAssertTrue("where is $marker?", $info);
        $location = $info['location'];
        $state = $info['state'] + 0;
        $num = getPart($location, 1) + 0;
        $pos = $num;
        if ($includeState)
            $pos += ($this->getPlayersNumber() - $state) / 10;
        return $pos;
    }

    function dbGetLastPlayerId()
    {
        $players = $this->getPlayerIds();
        $minpos = ($this->getMaxTime() + 1) * 10;
        $looser = null;
        foreach ($players as $player_id) {
            $pos = $this->dbGetPlayerTimePosition($player_id, true);
            if ($minpos > $pos) {
                $minpos = $pos;
                $looser = $player_id;
            }
        }
        return $looser;
    }
    function dbGetFirstPlayerId()
    {
        $players = $this->getPlayerIds();
        $maxpos = 0;
        $selectedId = null;
        foreach ($players as $player_id) {
            $pos = $this->dbGetPlayerTimePosition($player_id, true);
            if ($maxpos < $pos) {
                $maxpos = $pos;
                $selectedId = $player_id;
            }
        }
        return $selectedId;
    }

    function dbGetTime($player_id)
    {
        $color = $this->getPlayerColor($player_id);
        $marker = "timemarker_$color";
        $location = $this->tokens->getTokenLocation($marker);
        $num = getPart($location, 1);
        return (int)$num;
    }

    function dbGetAdvance($player_id)
    {
        $last = $this->dbGetFirstPlayerId();
        $pos = $this->dbGetPlayerTimePosition($player_id);
        $lastPos = $this->dbGetPlayerTimePosition($last);
        $newPos = $lastPos + 1;
        $max = $this->getMaxTime();
        if ($newPos > $max)
            $newPos = $max;
        $advance = $newPos - $pos;
        return $advance;
    }

    function dbGetAutoIncTokens($restype, $location, $requested = 1, $syncDb = true)
    {
        $max = 10;
        if ($max < $requested + 1)
            $max = $requested + 1;
        $resa = $this->tokens->getTokensOfTypeInLocation($restype, $location);
        $count = count($resa);
        $num = $max - $count;
        if ($num > 0) {
            // re-stock
            $keys = [];
            for ($i = 0; $i < $num; $i++) {
                $suf = $this->tokens->createTokenAutoInc($restype, $location);
                $keys[] = $suf;
            }
            if ($syncDb)
                $this->dbSyncInfo($keys);
            $resa = $this->tokens->getTokensOfTypeInLocation($restype, $location);
        }
        return array_slice($resa, 0, $requested, true);
    }

    function dbGetFreeButtons($requested)
    {
        return $this->dbGetAutoIncTokens('pbutton', 'supply_buttons', $requested);
    }

    function dbGetPatchOne($player_id)
    {
        $color = $this->getPlayerColor($player_id);
        return $this->tokens->getTokenOfTypeInLocation("patch_0", "tableau_$color");
    }

    function mtCollectWithField($field, $callback = null)
    {
        $res = [];
        foreach ($this->token_types as $id => $info) {
            if (array_key_exists($field, $info)) {
                $trig = $info[$field];
                if ((!$callback) || $callback($trig, $id)) {
                    $res[] = $id;
                }
            }
        }
        return $res;
    }

    function stateToRotor($state)
    {
        $ydir = (int) ($state / 4);
        $zdir = $state % 4;
        $rotateY = $ydir * 180;
        $rotateZ = $zdir * 90;
        $rotor = "${rotateZ}_$rotateY";
        return $rotor;
    }

    function isComplete7x7($color)
    {
        $occupancy = $this->getOccupancyMatrix($color);
        $has7 = $this->matrix->hasfilled($occupancy, 7);
        return $has7;
    }



    function saction_PayButtons($buttonsnum, $player_id = -1)
    {
        if ($player_id == -1)
            $player_id = $this->getActivePlayerId();
        $color = $this->getPlayerColor($player_id);
        $curbuttons = $this->tokens->getTokensInLocation("buttons_$color");
        $this->userAssertTrue(self::_('Not enough buttons'), count($curbuttons) >= $buttonsnum);
        $buttons = array_slice($curbuttons, 0, $buttonsnum, true);
        //clienttranslate('${player_name} pays ${token_div_count}')
        $this->dbSetTokensLocation($buttons, 'supply_buttons', 0, '');
    }

    function saction_GainButtons($advance, $player_id = -1, $notif = '*')
    {
        if ($player_id == -1)
            $player_id = $this->getActivePlayerId();
        $color = $this->getPlayerColor($player_id);
        $buttons = $this->dbGetFreeButtons($advance);
        if ($notif === '*')
            $notif = clienttranslate('${player_name} gains ${token_div_count}');
        $this->dbSetTokensLocation($buttons, "buttons_$color", 0, $notif);
    }

    function getCurrentIncome($player_id)
    {
        $color = $this->getPlayerColor($player_id);
        $onboard = $this->tokens->getTokensOfTypeInLocation(null, "square_${color}%");
        $buttons = 0;
        foreach ($onboard as $token_id => $info) {
            $income = $this->getRulesFor($token_id, 'income');
            if ($income) {
                $buttons += $income;
            }
        }
        return $buttons;
    }

    function saction_Income($player_id)
    {
        $buttons = $this->getCurrentIncome($player_id);
        if ($buttons == 0)
            $this->notifyWithName('message', clienttranslate('${player_name} receives no income'), [], $player_id);
        else
            $this->saction_GainButtons($buttons, $player_id, clienttranslate('${player_name} receives income of ${token_div_count}'));
    }

    function saction_PlacePatch($color, $token_id, $dropTarget, $rotateZ, $rotateY)
    {
        $rotateZ = $rotateZ % 360;
        $rotateY = $rotateY % 360;
        $rotor = "${rotateZ}_$rotateY";
        $occupancy = $this->getOccupancyMatrix($color);
        $moves = $this->arg_possibleMoves($token_id, $color, $rotor, $occupancy)[$rotor];
        $valid = array_search($dropTarget, $moves) !== false;
        $this->userAssertTrue(self::_("Not possible to place patch: illegal move"), $valid);
        $state = $rotateZ / 90 + $rotateY / 180 * 4;
        $buts = $this->getRulesFor($token_id, 'cost');
        $time = $this->getRulesFor($token_id, 'time');
        $message = clienttranslate('${player_name} places patch paying ${but} buttons and ${time} time ${token_div}');
        if ($this->isHalloween())
            $message = clienttranslate('${player_name} places patch paying ${but} eyeballs and ${time} time ${token_div}');
        $this->dbSetTokenLocation(
            $token_id,
            $dropTarget,
            $state,
            $message,
            ['but' => $buts, 'time' => $time]
        );
        $spec = $this->tokens->getTokenState("tile_special7x7");
        if (!$spec && $this->isComplete7x7($color)) {
            $this->dbSetTokenLocation("tile_special7x7", "tableau_$color", 1, clienttranslate('${player_name} wins ${token_name} worth 7 points at the end of the game'));
        }
        $occupancy = $this->getOccupancyMatrix($color);
        $unoccup_count = $this->getOccupancyEmpty($occupancy);
        $this->notifyCounterDirect("empties_${color}_counter", $unoccup_count, '');
    }

    function saction_MoveNeutralToken($pos)
    {
        $this->dbSetTokenLocation('token_neutral', 'market', $pos, '');
        // shift everything
        $patchesall = $this->tokens->getTokensInLocation('market', null, 'token_state');
        $count = count($patchesall);
        $upd = [];
        $i = 0;
        if ($count <= 3) $shift = 3 - $pos;
        else $shift = $pos - min(3, $count - 3); 
        while ($shift > 0) {
            array_push($patchesall, array_shift($patchesall));
            $shift--;
        }
        foreach ($patchesall as $info) {
            $state = $info['state'] + 0;
            if ($state != $i) {
                $this->tokens->setTokenState($info['key'], $i);
                $info['state'] = $i;
                $upd[] = $info;
            }
            $i++;
        }
        $this->dbSyncInfo($upd, true);

        $player_id = $this->getActivePlayerId();
        $income = $this->getCurrentIncome($player_id);
        $this->notifyAllPlayers('eofnet', '', [
            'len' => $count,
            'pos' => $pos,
            'income' => $income,
            'player_color' => $this->getPlayerColor($player_id)
        ]); // end of moving neutral token
    }


    function saction_FinalScoring()
    {
        $players = $this->loadPlayersBasicInfos();
        $info_special = $this->tokens->getTokenInfo("tile_special7x7");

        foreach ($players as $player_id => $info) {
            $this->dbSetScore($player_id, 0);
            $color = $info['player_color'];
            // buttons
            $curbuttons = $this->tokens->getTokensInLocation("buttons_$color");
            $curbuttons_count = count($curbuttons);
            $this->dbIncScoreValueAndNotify($player_id, $curbuttons_count, clienttranslate('${player_name} gains ${mod} point(s) for buttons'), 'game_buttons');
            // special tile
            if (getPart($info_special['location'], 1, true) === $color) {
                $this->dbIncScoreValueAndNotify($player_id, 7, clienttranslate('${player_name} gains ${mod} point(s) for Special Tile'), 'game_special');
            }


            // empty spaces

            $occupancy = $this->getOccupancyMatrix($color);
            $unoccup_count = $this->getOccupancyEmpty($occupancy);
            $this->dbIncScoreValueAndNotify($player_id, -$unoccup_count * 2, clienttranslate('${player_name} loses ${mod} point(s) for empty spaces'), 'game_empty_slot');
        }
        $firstOnSpot = $this->dbGetFirstPlayerId();
        $this->dbSetAuxScore($firstOnSpot, 1);
    }

    function saction_PayTime($time, $player_id = -1)
    {
        if ($player_id == -1)
            $player_id = $this->getActivePlayerId();
        $color = $this->getPlayerColor($player_id);
        $curtime = $this->dbGetTime($player_id);
        $newtime = $curtime + $time;
        if ($newtime > $this->getMaxTime()) {
            $newtime = $this->getMaxTime();
        }
        $location = "timetracker_$newtime";
        $marker = "timemarker_$color";
        $others = $this->tokens->getTokensOfTypeInLocation('timemarker', $location);
        $state = count($others);
        //clienttranslate('${player_name} pays ${time} time')[      'time' => $time ]
        $this->dbSetTokenLocation($marker, $location, $state, '');
    }


    function saction_MoveTime($player_id, $time_inc)
    {
        $curtime = $this->dbGetPlayerTimePosition($player_id);
        $this->saction_PayTime($time_inc, $player_id);
        for ($i = $curtime + 1; $i <= $curtime + $time_inc; $i++) {
            $income = $this->getRulesFor("timetracker_$i", 'income');
            if ($income) {
                $this->saction_Income($player_id);
            }
            $token = $this->tokens->getTokenOfTypeInLocation("patch_0_", "timetracker_$i");
            if ($token) {
                $color = $this->getPlayerColor($player_id);

                $occupancy = $this->getOccupancyMatrix($color);
                $nospaceleft = $this->matrix->hasfilled($occupancy, 9);
                if ($nospaceleft)
                    $this->dbSetTokenLocation($token['key'], "limbo", 1, clienttranslate('${player_name} gains special patch (one square), but there is no space left to place it!!!'));
                else
                    $this->dbSetTokenLocation($token['key'], "tableau_$color", 1, clienttranslate('${player_name} gains special patch (one square)'));
            }
        }
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    function action_place($token_id, $dropTarget, $rotateZ, $rotateY)
    {
        $this->checkAction('place');
        $this->adjustedMaterial();
        $this->setGameStateValue("var_auto_count", 0);

        $player_id = $this->getActivePlayerId();
        //$this->notifyWithName('message', clienttranslate('${player_name} plays pick and place action'));

        $buts = $this->getRulesFor($token_id, 'cost');
        $time = $this->getRulesFor($token_id, 'time');
        $this->saction_PayButtons($buts, $player_id);

        $color = $this->getPlayerColor($player_id);
        $canBuy  = $this->arg_canBuyPatches($color);
        $this->userAssertTrue(self::_("Cannot buy this patch Yet"), array_search($token_id, $canBuy) !== false);
        $pos = $this->tokens->getTokenState($token_id);
        $this->saction_PlacePatch($color, $token_id, $dropTarget, $rotateZ, $rotateY);
        $this->saction_MoveNeutralToken($pos);

        $this->saction_MoveTime($player_id, $time);
        $patch1 = $this->dbGetPatchOne($player_id);
        if ($patch1) {
            $this->gamestate->nextState('patchone');
            return;
        }
        $this->gamestate->nextState('next');
    }

    function action_placeSpecial($token_id, $dropTarget)
    {
        $this->checkAction('placeSpecial');
        $player_id = $this->getActivePlayerId();
        $color = $this->getPlayerColor($player_id);
        $patch1 = $this->dbGetPatchOne($player_id);
        $this->saction_PlacePatch($color, $patch1['key'], $dropTarget, 0, 0);
        $this->gamestate->nextState('next');
    }

    function action_advance($auto = false)
    {
        $player_id = $this->getActivePlayerId();
        $message = clienttranslate('${player_name} plays advance for ${token_div_count} (auto-advance)');
        if ($auto == false) {
            $this->checkAction('advance');
            $this->setGameStateValue("var_auto_count", 0);
            $message = clienttranslate('${player_name} plays advance for ${token_div_count}');
        } else {
            $this->notifyWithName("message_warning", '', ['message' => clienttranslate('${player_name} auto-advances'), 'player_name' => $this->getPlayerName($player_id)], $player_id);
        }

        $time = $this->dbGetAdvance($player_id);


        $this->saction_GainButtons($time, $player_id, $message);
        $this->saction_MoveTime($player_id, $time);
        $patch1 = $this->dbGetPatchOne($player_id);
        if ($patch1) {
            $this->gamestate->nextState('patchone');
            return;
        }
        $this->gamestate->nextState('next');
    }

    function action_undo()
    {
        $this->undoRestorePoint();
    }

    function action_endGame()
    {
        $this->checkAction('endGame');
        $this->gamestate->nextState('next');
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Game state arguments
    ////////////
    function arg_playerTurn()
    {
        $this->adjustedMaterial();
        $player_id = $this->getActivePlayerId();
        $color = $this->getPlayerColor($player_id);
        $res = [];
        $patches = $this->arg_canBuyPatches($color);
        $curbuttons = $this->tokens->getTokensInLocation("buttons_$color");
        $buttons = count($curbuttons);
        $canUseAny = false;
        $occupancy = $this->getOccupancyMatrix($color);
        foreach ($patches as $patch) {
            $moves = $this->arg_possibleMoves($patch, $color, null, $occupancy);
            $canPlace = false;
            foreach ($moves as $arr) {
                if (count($arr) > 0) {
                    $canPlace = true;
                    break;
                }
            }
            $res['patches'][$patch]['moves'] = $moves;
            $res['patches'][$patch]['canPlace'] = $canPlace;
            $cost = $this->getRulesFor($patch, 'cost');
            $canPay = $cost <= $buttons;
            $res['patches'][$patch]['canPay'] = $canPay;
            $canUse = $canPay && $canPlace;
            $res['patches'][$patch]['canUse'] = $canPay && $canUse;
            $canUseAny = $canUseAny || $canUse;
        }
        $advance = $this->dbGetAdvance($player_id);
        $res += ['advance' => $advance];
        $res += ['buttons' => $buttons];
        $res['canPatch'] = $canUseAny;

        if (!$canUseAny) {
            $res['autoturn'] = true;
            $value = $this->getGameStateValue("var_auto_count", 0);
            if ($value > MAX_AUTO_TURNS) {
                $res['autoturn'] = false;
            }
            if (!$this->isAutoAdvanceOn($player_id)) {
                $res['autoturn'] = false;
            }
            if ($res['autoturn'] == true) {
                $res['_no_notify'] = true;
                $res['patches'] = [];
            }
        }

        return $res;
    }

    function arg_playerPatchOne()
    {

        $player_id = $this->getActivePlayerId();
        $color = $this->getPlayerColor($player_id);
        $res = [];
        $patch = $this->dbGetPatchOne($player_id);
        if ($patch)
            $patch = $patch['key'];
        else
            return [];
        $moves = $this->arg_possibleMoves($patch, $color);
        $canPlace = false;
        foreach ($moves as $arr) {
            if (count($arr) > 0) {
                $canPlace = true;
                break;
            }
        }
        $res['patches'][$patch]['moves'] = $moves;
        $res['patches'][$patch]['canPlace'] = $canPlace;
        $res['patches'][$patch]['canUse'] = true;
        $res['patches'][$patch]['canPay'] = true;
        $res['patchone'] = $patch;


        return $res;
    }

    function arg_occupancyData($color)
    {
        $this->adjustedMaterial();
        $tokens = $this->tokens->getTokensOfTypeInLocation("patch", "square_${color}%");
        //$this->warn(toJson($tokens));
        $occupdata = [];
        foreach ($tokens as $key => $info) {
            $loc = $info['location'];
            $state = $info['state'];
            $y = getPart($loc, 2);
            $x = getPart($loc, 3);
            $rotor2 = $this->stateToRotor($state);
            $mask2 = $this->getRulesFor($key, 'mask');
            $occupdata[] = [$x, $y, $mask2, $rotor2];
        }
        return $occupdata;
    }

    function getOccupancyMatrix($color)
    {
        $occupdata = null;
        if ($color !== null) {
            $occupdata = $this->arg_occupancyData($color);
        }
        $occupancy = $this->matrix->occupancyMatrix($occupdata);

        return $occupancy;
    }

    function getOccupancyEmpty($occupancy)
    {
        $unoccup = $this->matrix->remap($occupancy, '', 0);
        $unoccup_count = count($unoccup);
        $empty = $unoccup_count;
        return $empty;
    }

    function arg_possibleMoves($patch, $color = null, $rotor = null, $occupancy = null)
    {
        $this->adjustedMaterial();
        if ($color !== null) {
            $prefix = "square_${color}_";
        } else
            $prefix = '';

        if ($occupancy == null) {
            $occupancy = $this->getOccupancyMatrix($color);
        }
        $mask = $this->getRulesFor($patch, 'mask');
        return $this->matrix->possibleMoves($mask, $prefix, $rotor, $occupancy);
    }

    function arg_canBuyPatches($color)
    {
        //$patches = [ 'patch_16','patch_1','patch_18' ];

        $patchesall = $this->tokens->getTokensInLocation('market', null, 'token_state');
        $keys = $this->tokens->toTokenKeyList($patchesall);
        $index = array_search('token_neutral', $keys);
        array_splice($keys, $index, 1);
        $size = count($keys);
        if ($size <= 3)
            return $keys;
        $patches = [];
        for ($i = 0; $i < 3; $i++) {
            $patches[] = $keys[($index + $i) % $size];
        }
        return $patches;
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Game state actions
    ////////////
    function st_gameTurnNextPlayer()
    {
        $lastId = $this->dbGetLastPlayerId();
        $lastTime = $this->dbGetTime($lastId);
        if ($lastTime >= $this->getMaxTime()) {
            $this->saction_FinalScoring();
            $this->gamestate->nextState('last');
            return;
        }
        $this->setGameStateValue("patchone_trig", 0);
        $this->setNextActivePlayerCustom($lastId);
        $this->gamestate->nextState('next');
    }

    function st_playerTurn()
    {
        $args = $this->arg_playerTurn();
        $autoturn = array_value_get($args, 'autoturn', false);

        if ($autoturn) {
            $this->incGameStateValue("var_auto_count", 1); // fail safe in case we blow notif limit
            $this->action_advance(true);
            //this->sendNotifications(); // have to do it so it does not bundle too much
        }
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Zombie
    ////////////
    /*
     * zombieTurn:
     *
     * This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
     * You can do whatever you want in order to make sure the turn of this player ends appropriately
     * (ex: pass).
     *
     * Important: your zombie code will be called when the player leaves the game. This action is triggered
     * from the main site and propagated to the gameserver from a server, not from a browser.
     * As a consequence, there is no current player associated to this action. In your zombieTurn function,
     * you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged"
     * error message.
     */
    function zombieTurn($state, $player_id)
    {
        $statename = $state['name'];
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                case 'playerTurn':
                    $time = $this->dbGetAdvance($player_id);
                    $this->saction_GainButtons($time, $player_id, clienttranslate('${player_name} plays advance for ${token_div_count}'));
                    $this->saction_MoveTime($player_id, $time);
                    $this->gamestate->nextState("next");
                    break;
                default:
                    $this->gamestate->nextState("next");
                    break;
            }
            return;
        }
        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive($player_id, 'next');
            return;
        }
        throw new feException("Zombie mode not supported at this game state: " . $statename);
    }

    ///////////////////////////////////////////////////////////////////////////////////:
    ////////// DB upgrade
    //////////
    /*
     * upgradeTableDb:
     *
     * You don't have to care about this until your game has been published on BGA.
     * Once your game is on BGA, this method is called everytime the system detects a game running with your old
     * Database scheme.
     * In this case, if you change your Database scheme, you just have to apply the needed changes in order to
     * update the game database and allow the game to continue to run with your new version.
     *
     */
    function upgradeTableDb($from_version)
    {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        // Example:
        //        if( $from_version <= 1404301345 )
        //        {
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
        //            self::applyDbUpgradeToAllDB( $sql );
        //        }
        //        if( $from_version <= 1405061421 )
        //        {
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
        //            self::applyDbUpgradeToAllDB( $sql );
        //        }
        //        // Please add your future database scheme changes here
        //
        //
    }
}
