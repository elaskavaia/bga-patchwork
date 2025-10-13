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
 * gameoptions.inc.php
 *
 * patchwork game options description
 * 
 * In this file, you can define your game options (= game variants).
 *   
 * Note: If your game has no variant, you don't have to modify this file.
 *
 * Note²: All options defined in this file should have a corresponding "game state labels"
 *        with the same ID (see "initGameStateLabels" in patchwork.game.php)
 *
 * !! It is not a good idea to modify this file when a game is running !!
 *
 */

$game_options = [
        // note: game variant ID should start at 100 (ie: 100, 101, 102, ...). The maximum is 199.
        100 =>  [
                'name' => totranslate('Edition'),
                'values' => [
                        0 => ['name' => totranslate('Americana'), 'tmdisplay' => totranslate('Americana') ],
                        1 => ['name' => totranslate('Original'), 'tmdisplay' => totranslate('Original') ],
                        2 => ['name' => totranslate('Halloween'), 'tmdisplay' => totranslate('Halloween') ],
                        3 => ['name' => totranslate('Folklore Poland'), 'tmdisplay' => totranslate('Folklore Poland') ],
                        4 => ['name' => totranslate('10th Anniversary Edition'), 
                              'tmdisplay' => totranslate('10th Anniversary Edition')],
                        
                ],
                'level' => "major",
                'default' => 4,
        ], 
        
];

$game_preferences = array(
        100 => array(
                'name' => totranslate('Market Layout'),
                'needReload' => true, // after user changes this preference game interface would auto-reload
                'values' => array(
                        1 => array( 'name' => totranslate( 'Circle' ), 'cssPref' => 'market_circle' ),
                        2 => array( 'name' => totranslate( 'Scroll' ), 'cssPref' => 'market_scroll' )
                ),
                'default' => 1
        ),
        101 => array(
                'name' => totranslate('Cost Tags'),
                'needReload' => true, // after user changes this preference game interface would auto-reload
                'values' => array(
                        1 => array( 'name' => totranslate( 'Market Only' ), 'cssPref' => 'stickers_market' ),
                        2 => array( 'name' => totranslate( 'Always' ), 'cssPref' => 'stickers_always' )
                ),
                'default' => 1
        ),
        102 => array(
                'name' => totranslate('Background'),
                'needReload' => true, // after user changes this preference game interface would auto-reload
                'values' => array(
                        0 => array( 'name' => totranslate( 'BGA default' ), 'cssPref' => 'pw_bg_bga' ),
                        1 => array( 'name' => totranslate( 'Thematic' ), 'cssPref' => 'pw_bg_theme' )
                ),
                'default' => 1
        )
);


