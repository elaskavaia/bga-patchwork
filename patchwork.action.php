<?php

/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * patchwork implementation : © Alena Laskavaia <laskava@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * patchwork.action.php
 *
 * patchwork main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/patchwork/patchwork/myAction.html", ...)
 *
 */
class action_patchwork extends APP_GameAction {

    // Constructor: please do not modify
    public function __default() {
        if (self::isArg('notifwindow')) {
            $this->view = "common_notifwindow";
            $this->viewArgs ['table'] = self::getArg("table", AT_posint, true);
        } else {
            $this->view = "patchwork_patchwork";
            self::trace("Complete reinitialization of board game");
        }
    }

    public function place() {
        self::setAjaxMode();
        $token = self::getArg('token', AT_alphanum, true);
        $rotateY = self::getArg('rotateY', AT_int, true);
        $rotateZ = self::getArg('rotateZ', AT_int, true);
        $dropTarget = self::getArg('dropTarget', AT_alphanum, true);
        $this->game->action_place($token, $dropTarget, $rotateZ, $rotateY);
        self::ajaxResponse();
    }
    
    public function placeSpecial() {
        self::setAjaxMode();
        $token = self::getArg('token', AT_alphanum, true);
        $dropTarget = self::getArg('dropTarget', AT_alphanum, true);
        $this->game->action_placeSpecial($token, $dropTarget);
        self::ajaxResponse();
    }

    public function advance() {
        self::setAjaxMode();
        $this->game->action_advance();
        self::ajaxResponse();
    }

    public function undo() {
        self::setAjaxMode();
        $this->game->action_undo();
        self::ajaxResponse();
    }
    
    public function endGame() {
        self::setAjaxMode();
        $this->game->action_endGame();
        self::ajaxResponse();
    }
}
  

