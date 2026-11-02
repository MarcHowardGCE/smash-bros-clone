$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$helpers=[IO.File]::ReadAllText((Join-Path $PSScriptRoot 'generate-pixel-study.ps1'))
$start=$helpers.IndexOf('$pal =')
. ([scriptblock]::Create($helpers.Substring($start,$helpers.IndexOf('function Hero(')-$start)))
$out=Join-Path $root 'assets\ability-studies-v1'
New-Item -ItemType Directory -Force -Path $out | Out-Null
function Text($im,$s,$x,$y,$size=12,$color='#eef1f5'){
 $g=[Drawing.Graphics]::FromImage($im);$g.TextRenderingHint=[Drawing.Text.TextRenderingHint]::SingleBitPerPixelGridFit
 $f=[Drawing.Font]::new('Consolas',$size,[Drawing.FontStyle]::Regular,[Drawing.GraphicsUnit]::Pixel)
 $b=[Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml($color))
 $g.DrawString($s,$f,$b,$x,$y);$b.Dispose();$f.Dispose();$g.Dispose()
}
function LoadSprite($name){return ,([Drawing.Bitmap]::FromFile((Join-Path $root "assets\character-lineup-v1\$name-idle.png")))}
$egg=LoadSprite 'egghead-adult';$cap=LoadSprite 'captain-adult'
$cannon=New-Canvas 32 32
Poly $cannon @(11,6,21,6,27,12,27,22,21,27,11,27,5,21,5,12) 'ink'
Poly $cannon @(12,8,20,8,25,13,25,21,20,25,12,25,7,20,7,13) 'stone'
Box $cannon 11 10 8 3 '#a4b6bf';Box $cannon 9 13 3 5 '#a4b6bf';Box $cannon 18 23 4 1 'hair'
Save $cannon 'cannonball-study.png'
$trail=New-Canvas 32 16
Box $trail 1 7 25 2 'cream';Box $trail 8 3 22 2 'gold';Box $trail 10 12 18 2 'orange'
Save $trail 'charge-trail-study.png'
$jet=New-Canvas 16 16
Poly $jet @(4,0,12,0,10,7,8,14,6,7) 'gold'
Poly $jet @(6,0,10,0,8,9) 'cream'
Save $jet 'flight-exhaust-study.png'
$impact=New-Canvas 32 32
Poly $impact @(16,0,19,10,29,4,23,14,31,17,22,20,27,29,18,24,13,31,11,22,1,25,7,17,0,12,11,11) 'gold'
Poly $impact @(15,7,18,13,24,14,19,18,20,24,14,21,8,23,11,17,7,13,13,13) 'cream'
Save $impact 'impact-study.png'
# Eight storyboard panels.
$board=New-Canvas 1280 760;Box $board 0 0 1280 760 '#172538'
Text $board 'BONNEY / ABILITY STORYBOARDS' 24 16 24
Text $board 'Both abilities work at every age. One equipped power-up. Cooldown begins after the ability ends.' 24 50 15
for($r=0;$r -lt 2;$r++){
 $base=100+$r*325
 Text $board (@('EGGHEAD / FLIGHT','PIRATE CAPTAIN / CANNONBALL')[$r]) 24 $base 20
 for($c=0;$c -lt 4;$c++){
  $x=24+$c*312;$y=$base+38
  Box $board $x $y 296 185 '#243950';Box $board $x ($y+150) 296 2 '#80949b'
  $hero=if($r -eq 0){$egg}else{$cap}
  if($r -eq 0){
   $hy=if($c -eq 1){$y+7}else{$y+25}
   Paste $board $hero ($x+90) $hy 3
   if($c -eq 1){Paste $board $jet ($x+102) ($hy+92) 2}
  } elseif($c -eq 1){
   Paste $board $trail ($x+25) ($y+73) 3;Paste $board $cannon ($x+111) ($y+35) 3
  } elseif($c -eq 2){
   Paste $board $cannon ($x+70) ($y+35) 3;Paste $board $impact ($x+166) ($y+35) 3
  } else {Paste $board $hero ($x+90) ($y+25) 3}
  $title=if($r -eq 0){@('1 / READY','2 / FLYING - 5s','3 / RECHARGE - 5s','4 / READY AGAIN')[$c]}else{@('1 / READY','2 / CHARGE FORWARD','3 / ENEMY IMPACT','4 / RECHARGE - 5s')[$c]}
  Text $board $title ($x+10) ($y+162) 14
  $note=if($r -eq 0){@('Jump, then press jump again.','Flight timer counts down.','Ability unavailable until full.','Activate on a new double jump.')[$c]}else{@('Ability button: proposed X.','Duration and speed: tune in play.','Massive damage; amount TBD.','Starts after cannonball ends.')[$c]}
  Text $board $note ($x+4) ($y+194) 12
 }
 if($r -eq 0){
  Box $board 24 ($base+270) 600 12 '#b17ad1';Box $board 624 ($base+270) 600 12 '#e7ba64'
  Text $board '0s                    FLIGHT                    5s                   COOLDOWN                   10s / READY' 24 ($base+286) 13
 } else {
  Text $board 'READY -> ACTIVE CHARGE (duration TBD) -> 5 SECOND COOLDOWN -> READY' 24 ($base+270) 16
 }
}
Save $board 'ability-storyboards.png'
# Build new harbor compositions from tile assets and the selected sprites.
$tiles=[Drawing.Bitmap]::FromFile((Join-Path $root 'assets\pixel-v1\harbor-tiles.png'))
function Tile($scene,$index,$x,$y){
 $g=[Drawing.Graphics]::FromImage($scene)
 $g.DrawImage($tiles,[Drawing.Rectangle]::new($x,$y,16,16),$index*16,0,16,16,[Drawing.GraphicsUnit]::Pixel);$g.Dispose()
}
function Heart($im,$x,$y,$full){
 $col=if($full){'hair'}else{'darkstone'}
 Poly $im @($x,($y+2),($x+2),$y,($x+4),$y,($x+5),($y+2),($x+7),$y,($x+9),$y,($x+11),($y+2),($x+11),($y+5),($x+5),($y+10),$x,($y+5)) $col
}
$states=@('ready','active','cooldown');$screens=@()
for($k=0;$k -lt 3;$k++){
 $scene=New-Canvas 384 216;Box $scene 0 0 384 216 '#89cfdd';Box $scene 0 112 384 104 'water'
 for($i=0;$i -lt 12;$i++){
  $x=$i*36-8;$h=25+($i%4)*9;Box $scene $x (112-$h) 27 $h '#bbd8d5'
  Box $scene $x (110-$h) 27 3 '#a2bdba';Box $scene ($x+6) (118-$h) 3 5 '#8ab5bd'
 }
 for($x=0;$x -lt 384;$x+=16){
  if($x -lt 112 -or $x -ge 208){Tile $scene 0 $x 176;Tile $scene 1 $x 192}
  Tile $scene 3 $x 208
 }
 for($x=128;$x -lt 192;$x+=16){Tile $scene 2 $x 144}
 Box $scene 132 151 4 57 'coat';Box $scene 184 151 4 57 'coat'
 Tile $scene 4 286 160;Tile $scene 5 320 160
 foreach($p in @(@(104,145),@(123,124),@(143,108))){Tile $scene 6 $p[0] $p[1]}
 Box $scene 359 125 2 51 'wood';Poly $scene @(361,126,376,126,376,140,361,137) 'hair'
 if($k -eq 1){Paste $scene $egg 152 79;Paste $scene $jet 156 109}
 else {Paste $scene $egg 48 145}
 # HUD: independent health and ability readouts.
 Box $scene 0 0 384 40 '#172538'
 for($i=0;$i -lt 3;$i++){Heart $scene (8+$i*14) 5 $true}
 Text $scene 'ADULT / 3 HITS' 7 22 9
 Text $scene 'EGGHEAD' 112 4 10 '#cba4e8'
 $status=@('READY','FLYING 3.2s','RECHARGE 2.5s')[$k]
 Text $scene $status 214 4 10
 Box $scene 214 20 158 8 '#435764'
 $width=@(158,101,79)[$k];$color=if($k -eq 2){'gold'}else{'#b17ad1'}
 Box $scene 214 20 $width 8 $color
 Text $scene (@('DOUBLE JUMP TO FLY','ACTIVE TIME LEFT','CHARGE PROGRESS')[$k]) 214 29 9
 Save $scene ("harbor-hud-"+$states[$k]+"-384x216.png")
 $screens+=,$scene
}
$hudboard=New-Canvas 1200 540;Box $hudboard 0 0 1200 540 '#172538'
Text $hudboard 'HARBOR / HUD STATES AT NATIVE SIZE' 16 12 22
for($i=0;$i -lt 3;$i++){
 Text $hudboard $states[$i].ToUpper() (8+$i*400) 56 16
 Paste $hudboard $screens[$i] (8+$i*400) 90
 $preview=New-Canvas 1536 864;Paste $preview $screens[$i] 0 0 4
 Save $preview ("harbor-hud-"+$states[$i]+"-4x.png");$preview.Dispose()
}
Text $hudboard 'HEALTH: age + hits remaining. POWER-UP: equipped outfit. ABILITY: ready / active / recharging.' 16 346 16
Text $hudboard 'Purple counts down active flight. Gold fills during recharge. Text carries the state as well as color.' 16 380 15
Text $hudboard 'Static artwork studies only; controls, timers and gameplay are not implemented yet.' 16 430 15
Save $hudboard 'harbor-hud-states.png'
Write-Output 'Exported storyboards, effect studies, and three HUD states.'
