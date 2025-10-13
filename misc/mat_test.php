<?php

define("APP_GAMEMODULE_PATH", "misc/"); // include path to mocks, this defined "Table" and other classes

require_once ('patchwork.game.php');
//require_once ('modules/PwMatrix.php');

// include real game class, it has to be on php inlude path
// this can test if material file has not errors, run
// php7 misc/mat_test.php
class patchworkTest1 extends patchwork {
    function __construct() {
        parent::__construct();
        include '../material.inc.php';
    }

    function testSanity() {
        $patch = 'patch_13';
        for ($i = 1; $i < 30; $i++) {
            $patch = 'patch_' . $i;
            $mask = $this->getRulesFor($patch, 'mask');
            //var_dump($mask);
            //$poly=$this->matrix->toPolygon($mask,1);
            //var_dump($poly);
            $piecematrix = $this->matrix->pieceMatrix($mask, 0, 180);
            $h = count($piecematrix);
            $w = count($piecematrix [0]);
            $rh=$this->getRulesFor($patch, 'h');
            $rw=$this->getRulesFor($patch, 'w');
            if ($h!=$rh) echo("$patch h $h $rh");
            if ($w!=$rw) echo("$patch w $w $rw");
        }
        
        //$this->matrix->dumpMatrix($piecematrix,'pice0_180');
        
        //$occupancy = $this->matrix->occupancyMatrix();
        //$overlap = $this->matrix->intersectMatrix($occupancy, $piecematrix, 0, 0, true);
        //$this->matrix->dumpMatrix($overlap,'over');
       // print("$overlap\n");
        
        //$piecematrix = $this->matrix->pieceMatrix($mask, 90, 180);
        //$this->matrix->dumpMatrix($piecematrix,'pice90_180');
        
        //$moves = $this->possibleMoves($patch);
       // var_dump($moves["0_0"]);
        //var_dump($moves["0_180"]);
    }
}
$x = new patchworkTest1();
$x->testSanity();



