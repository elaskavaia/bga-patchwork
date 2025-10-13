<?php
if ( !defined('BOARD_SIZE')) {
    define("BOARD_SIZE", 9);
    define("MT_START", 0 - 5);
    define("MT_END", 9 + 5);
}

if (!function_exists('array_key_first')) {
    function array_key_first(array $arr) {
        foreach($arr as $key => $unused) {
            return $key;
        }
        return NULL;
    }
}

class PwMatrix extends APP_Object{

    function __construct($game) {
        # parent::__construct();
        $this->game = $game;
        $this->rotateZ = [ //
        0 => [ 1,0,0,1 ], //
        90 => [ 0, -1,1,0 ], //
        180 => [ -1,0, 0,-1 ], //
        270 => [ 0,1, -1,0 ], //
        ];
        $this->rotateY = [ // 
        180 => [ -1,0, 0,1 ], //
        ];
    }

    function emptyMatrix() {
        $res = [ ];
        for ($i = MT_START; $i < MT_END; $i++) {
            for ($j = MT_START; $j < MT_END; $j++) {
                $res [$i] [$j] = 0;
            }
        }
        return $res;
    }

    function occupancyMatrix($data = null) {
        $res = [ ];
        for ($i = MT_START; $i < MT_END; $i++) {
            for ($j = MT_START; $j < MT_END; $j++) {
                if ($j < 0 || $i < 0)
                    $val = 1;
                else if ($j >= BOARD_SIZE || $i >= BOARD_SIZE)
                    $val = 1;
                else {
                    $val = 0;
                }
                $res [$i] [$j] = $val;
            }
        }
        foreach ( $data as $row ) {
            list ( $x, $y, $mask, $rotor ) = $row;
            $deg_z = getPart($rotor, 0);
            $deg_y = getPart($rotor, 1);
            $piecematrix = $this->pieceMatrix($mask, $deg_z, $deg_y);
            //$pic=$this->dumpMatrix($piecematrix,"$mask $deg_z $deg_y",true);
            //$this->warn($pic);
            $res = $this->unionMatrix($res, $piecematrix, $y, $x);
        }
        return $res;
    }



    function pieceMatrix($mask, $deg_z=0, $deg_y=0) {
        $res = [ ];
        if ($mask) {
            $rrows = explode(':', $mask);
            for ($i = 1; $i < count($rrows); $i++) {
                $rrow = $rrows [$i];
                $w=strlen($rrow);
                for ($j = 0; $j < $w; $j++) {
                    $val = $rrow [$j];
                    $res [$i - 1] [$j] = $val;
                }
            }
        } 
        $deg_z = $deg_z % 360;
        if ($deg_y) $deg_y = 180;
       // $this->dumpMatrix($res,'orig');

        if ($deg_z!=0) {
            $res = $this->transform($res, $this->rotateZ[$deg_z]);
            //$this->dumpMatrix($res,"rotateZ($deg_z)");
        }
        if ($deg_y!=0 ) {
            $res = $this->transform($res, $this->rotateY[$deg_y]);
            //$this->dumpMatrix($res,"rotateY($deg_y)");
        }
        // $this->dumpMatrix($res);
        return $res;
    }

    function unionMatrix($occupancy, $piecematrix, $off_i, $off_j) {
        foreach ( $piecematrix as $i => $row ) {
            foreach ( $row as $j => $val ) {
                $occupancy [$off_i + $i] [$off_j + $j] |= $val;
            }
        }
        return $occupancy;
    }

    function intersectMatrix($occupancy, $piecematrix, $off_i, $off_j, $retbool=false) {
        foreach ( $piecematrix as $i => $row ) {
            foreach ( $row as $j => $val ) {
                $nval = ($occupancy [$off_i+$i] [$off_j+$j] = $val && $occupancy [$off_i+$i] [$off_j+$j]);
                if ($retbool && $nval) return 1;
            }
        }
        if ($retbool) return 0;
        
        return $occupancy;
    }

    function hasOverlap($matrix, $negative=false) {
        foreach ( $matrix as $row ) {
            foreach ( $row as $val ) {
                if ($val && $negative===false)
                    return 1;
                if (!$val && $negative === true)
                    return 1;
            }
        }
        return 0;
    }

    function dumpMatrix($matrix, $name = '', $retstr = false) {
        $h = count($matrix);
        $w = count($matrix [0]);
        $str = "matrix $name  $w x $h|\n";
        for ($i = MT_START; $i < MT_END; $i++) {
            $row = '';
            for ($j = MT_START; $j < MT_END; $j++) {
                if (isset($matrix [$i] [$j])) {
                    $val = $matrix [$i] [$j] ? 'X' : '_';
                } else {
                    $val = '/';
                }
                $row .= $val;
            }
            $str .= $row . "\n";
        }
        if ( !$retstr)
            print $str;
        return $str;
    }
    function availability($occupancy, $mask, $deg_z, $deg_y) {
        $piecematrix = $this->pieceMatrix($mask, $deg_z, $deg_y);
        $dominance = [ ];
        for ($i = 0; $i < BOARD_SIZE; $i++) {
            for ($j = 0; $j < BOARD_SIZE; $j++) {
                $overlap = $this->intersectMatrix($occupancy, $piecematrix, $i, $j, true);
                $dominance [$i] [$j] = $overlap;
            }
        }
        return $dominance;
    }

    function possibleMoves($mask, $prefix, $rotor, $occupancy) {
        if ($rotor)
            $rotor_arr = [ $rotor ];
        else
            $rotor_arr = $this->rotors($mask);
        $res = [ ];
       // $this->dump("occup",$this->dumpMatrix($occupancy,'occup', true));
        foreach ( $rotor_arr as $rot ) {
            $deg_z = getPart($rot, 0);
            $deg_y = getPart($rot, 1);
            $dominance = $this->availability($occupancy,$mask, $deg_z, $deg_y);
            $res [$rot] = $this->remap($dominance, $prefix, 0);
        }
        return $res;
    }

    function transformVec($x,$y, $trans) {
        $x1 = $x * $trans [0] + $y * $trans [1];
        $y1 = $x * $trans [2] + $y * $trans [3];
        return [ $x1,$y1 ];
    }
    function transform($matrix, $trans) {
        $res = [ ];
        //$this->dumpMatrix($matrix,'orig');
        foreach ( $matrix as $y => $row ) {
            foreach ( $row as $x => $val ) {
                $x1 = $x * $trans [0] + $y * $trans [1];
                $y1 = $x * $trans [2] + $y * $trans [3];
                $res [$y1] [$x1] = $val;
                //print ("$x,$y [$y1] [$x1] = $val\n");
            }
        }
        //$this->dumpMatrix($res,"trans $trans[0] $trans[1] $trans[2] $trans[3]");
        return $res;
    }

    function hasfilled($matrix, $max = 7) {
        for ($start_i = 0; $start_i <= BOARD_SIZE - $max; $start_i++) {
            for ($start_j = 0; $start_j <= BOARD_SIZE - $max; $start_j++) {
                $found = true;
                for ($i = $start_i; $i < $start_i + $max; $i++) {
                    for ($j = $start_j; $j < $start_j + $max; $j++) {
                        if (isset($matrix [$i] [$j]) && $matrix [$i] [$j]) {
                            continue;
                        }
                        $found = false;
                        //$this->debug("$max $start_i $start_j empty at $i $j|");
                        break 2;
                    }
                }
                if ($found) {
                    //$this->debug("$max $start_i $start_j found");
                    return true;
                }
            }
        }
        return false;
    }

    function remap($matrix, $prefix, $value) {
        //$this->dumpMatrix($matrix,'dominance');
        $res = [ ];
        for ($i = 0; $i < BOARD_SIZE; $i++) {
            for ($j = 0; $j < BOARD_SIZE; $j++) {
                if (array_key_exists($i, $matrix) && array_key_exists($j, $matrix [$i])) {
                    if ($matrix [$i] [$j] === $value) {
                        $res [] = "${prefix}${i}_${j}";
                    }
                }
            }
        }
        return $res;
    }

    function valueCoords($piecematrix, $xval = null) {
        $coords = [ ];
        foreach ( $piecematrix as $i => $row ) {
            foreach ( $row as $j => $val ) {
                if ($xval === null || $xval == $val) {
                    $coords [] = [ $i,$j,$val ];
                }
            }
        }
        return $coords;
    }

    function rotors($patch) {
        return [ "0_0","90_0","180_0","270_0","0_180","90_180","180_180","270_180" ];
    }
    
    function toPolygon($mask, $mul=1, &$matrix = null) {
        $matrix = $this->pieceMatrix($mask, 0, 0);
        $h = count($matrix);
        $w = count($matrix [0]);
        $y = 0;
        $poly = [ ];
        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                if ($matrix [$y] [$x]) {
                    for ($k = 0; $k < 9; $k++) {
                        $dx=$k%3;
                        $dy=(int)($k/3);
                        $poly [$y*2 + $dy] [$x*2 + $dx] = 1;
                    }
                }
            }
        }
        //$this->dumpMatrix($poly,'poly');
        $start_y = array_key_first($poly);
        $start_x = array_key_first($poly [$start_y]);
        $coords [] = [ $start_x,$start_y ];
        $this->toPolygonRec($poly, $coords, $start_x + 1, $start_y, 1, 0, $matrix);
        $res= [];
        foreach ( $coords as list ( $x, $y ) ) {
            $px=$x*$mul/2;
            $py=$y*$mul/2;
            $res[]=[$px,$py];
        }
        return $res;
    }

    function toPolygonRec(&$poly, &$coords, $x, $y, $step_x, $step_y, $matrix) {
        list ( $start_x, $start_y ) = $coords [0];
        if ($start_x == $x && $start_y == $y)
            return 1;
        foreach ( $coords as list ( $px, $py ) ) {
            if ($px == $x && $py == $y)
                return -1;
        }
        //print("step $x, $y, $step_x, $step_y\n");
        $rots = [ 270,0,90 ];
        foreach ( $rots as $deg ) {
            list ( $step_x2, $step_y2 ) = $this->transformVec($step_x, $step_y, $this->rotateZ [$deg]);
            $x2 = $x + $step_x2;
            $y2 = $y + $step_y2;
            if (isset($poly [$y2] [$x2])) {
                if ($deg != 0)
                    $coords [] = [ $x,$y ];
                $rc = $this->toPolygonRec($poly, $coords, $x2, $y2, $step_x2, $step_y2, $matrix);
                if ($rc != -1)
                    return 0;
            }
        }
        return -1;
    }
}