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
 * states.inc.php
 *
 * patchwork game states description
 *
 */
/*
 * Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
 * in a very easy way from this configuration file.
 *
 * Please check the BGA Studio presentation about game state to understand this, and associated documentation.
 *
 * Summary:
 *
 * States types:
 * _ activeplayer: in this type of state, we expect some action from the active player.
 * _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
 * _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide
 * what is the next game state.
 * _ manager: special type for initial and final state
 *
 * Arguments of game states:
 * _ name: the name of the GameState, in order you can recognize it on your own code.
 * _ description: the description of the current game state is always displayed in the action status bar on
 * the top of the game. Most of the time this is useless for game state with "game" type.
 * _ descriptionmyturn: the description of the current game state when it's your turn.
 * _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
 * _ action: name of the method to call when this game state become the current game state. Usually, the
 * action method is prefixed by "st" (ex: "stMyGameStateName").
 * _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
 * method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
 * _ transitions: the transitions are the possible paths to go from a game state to another. You must name
 * transitions in order to use transition names in "nextState" PHP method, and use IDs to
 * specify the next game state for each transition.
 * _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
 * client side to be used on "onEnteringState" or to set arguments in the gamestate description.
 * _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
 * method).
 */
//    !! It is not a good idea to modify this file when a game is running !!
if ( !defined('STATE_END_GAME')) { // guard since this included multiple times
    define("STATE_PLAYER_TURN", 2);
    define("STATE_GAME_TURN_NEXT_PLAYER", 3);
    define("STATE_PLAYER_GAME_END", 4);
    define("STATE_PLAYER_PATCHONE", 5);
    define("STATE_END_GAME", 99);
}

$machinestates = [    
        1 => [ // The initial state. Please do not modify.
               "name" => "gameSetup",
               "description" => "",
               "type" => "manager",
               "action" => "stGameSetup",
               "transitions" => [ "" => STATE_PLAYER_TURN ] ],
        // Game states 
        STATE_PLAYER_TURN => [ // main active player state 
                "name" => "playerTurn",
                "description" => clienttranslate('${actplayer} must take an action'),
                "descriptionmyturn" => clienttranslate('${you} must take an action'),
                "type" => "activeplayer",
                "args" => "arg_playerTurn",
                "action" => "st_playerTurn",
                "possibleactions" => [ "place","advance" ],
                "transitions" => [ 
                        "next" => STATE_GAME_TURN_NEXT_PLAYER,
                        "patchone" => STATE_PLAYER_PATCHONE,
                        "last" => STATE_PLAYER_GAME_END ] // 
        ],
        STATE_PLAYER_PATCHONE => [ // place special patch
                "name" => "playerPatchOne",
                "description" => clienttranslate('${actplayer} must place special patch'),
                "descriptionmyturn" => clienttranslate('${you} must place special patch'),
                "type" => "activeplayer",
                "args" => "arg_playerPatchOne",
                "possibleactions" => [ "placeSpecial" ],
                "transitions" => [
                        "next" => STATE_GAME_TURN_NEXT_PLAYER
                ] //
        ],
        STATE_GAME_TURN_NEXT_PLAYER => [ // next player state
                "name" => "gameTurnNextPlayer","description" => clienttranslate('Upkeep...'),
                "type" => "game", //
                "action" => "st_gameTurnNextPlayer", //
                "updateGameProgression" => true,
                "transitions" => [ "next" => STATE_PLAYER_TURN,"loopback" => STATE_GAME_TURN_NEXT_PLAYER,
                        "last" => STATE_END_GAME ], // STATE_PLAYER_GAME_END TODO remove after, its there to use undo during dev
        ],
    
        STATE_PLAYER_GAME_END => [ // active player state for debugging end of game
                "name" => "playerGameEnd",
                "description" => clienttranslate('${actplayer} Game is Over'),
                "descriptionmyturn" => clienttranslate('${you} Game is Over'),
                "type" => "activeplayer",
                "args" => "arg_playerTurn",
                "possibleactions" => ["endGame"],
                "transitions" => ["next" => STATE_END_GAME,"loopback" => STATE_PLAYER_GAME_END ] // 
        ],
        // End of Game states 
        // Final state.
        // Please do not modify (and do not overload action/args methods).
        STATE_END_GAME => [
                "name" => "gameEnd",
                "description" => clienttranslate("End of game"),"type" => "manager",
                "action" => "stGameEnd",
                "args" => "argGameEnd" ] 

];

