Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $root 'assets\pixel-v1'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$pal = @{
 ink='#302438'; hair='#df4b91'; light='#ff91bc'; shade='#a83373'; cream='#fff0ce'
 tan='#c89964'; skin='#f4bc95'; skinshade='#cc806b'; coat='#774736'; orange='#ef8a38'
 boot='#553a37'; white='#fff8e6'; gold='#ffd363'; stone='#637b88'; darkstone='#435764'
 water='#269fb4'; blue='#286b8a'; wood='#a36942'; woodlight='#d5a269'; navy='#263b58'
}
function New-Canvas($w,$h) { [System.Drawing.Bitmap]::new($w,$h,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb) }
function Box($im,$x,$y,$w,$h,$color) {
 $g=[System.Drawing.Graphics]::FromImage($im)
 $c=if($pal.ContainsKey($color)){$pal[$color]}else{$color}
 $b=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($c))
 $g.FillRectangle($b,[int]$x,[int]$y,[int]$w,[int]$h); $b.Dispose();$g.Dispose()
}
function Poly($im,$coords,$color) {
 $pts=[System.Drawing.Point[]]@();for($i=0;$i -lt $coords.Count;$i+=2){$pts += [System.Drawing.Point]::new($coords[$i],$coords[$i+1])}
 $g=[System.Drawing.Graphics]::FromImage($im)
 $b=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($pal[$color]))
 $g.FillPolygon($b,$pts);$b.Dispose();$g.Dispose()
}
function Paste($dst,$src,$x,$y,$scale=1) {
 $g=[System.Drawing.Graphics]::FromImage($dst)
 $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
 $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
 $g.DrawImage($src,[System.Drawing.Rectangle]::new($x,$y,$src.Width*$scale,$src.Height*$scale),0,0,$src.Width,$src.Height,[System.Drawing.GraphicsUnit]::Pixel)
 $g.Dispose()
}
function Save($im,$name) { $im.Save((Join-Path $out $name),[System.Drawing.Imaging.ImageFormat]::Png) }
function Hero($pose) {
 $im=New-Canvas 32 32
 # Shared hat/head/hair silhouette. All coordinates are integer pixels.
 Poly $im @(8,7,12,4,21,4,25,8,25,16,21,18,20,24,8,25,6,20,8,14) 'ink'
 Poly $im @(9,9,13,6,21,6,23,10,21,16,18,20,11,24,8,22,10,15) 'hair'
 Box $im 10 12 2 9 'light';Box $im 8 20 2 4 'shade'
 Poly $im @(15,8,22,8,24,11,23,16,19,18,15,15) 'skin'
 Box $im 21 10 2 4 'ink';Box $im 20 10 1 1 'white';Box $im 22 15 2 1 'skinshade'
 Poly $im @(7,7,11,2,20,1,24,4,25,8,22,10,7,10) 'ink'
 Poly $im @(9,6,12,3,19,2,23,4,23,6,19,7) 'cream'
 Poly $im @(8,7,20,6,24,5,24,8,20,9,8,9) 'tan'
 Box $im 10 7 8 1 'white';Box $im 15 15 1 2 'gold'
 # Jacket, shirt, belt, shorts.
 Poly $im @(13,17,18,16,23,18,24,23,21,26,12,25,10,21) 'ink'
 Poly $im @(13,18,16,17,16,22,13,24,11,21) 'coat'
 Box $im 17 18 4 4 'white';Box $im 20 18 2 3 'cream'
 Box $im 14 23 8 2 'orange';Box $im 14 22 8 1 'boot';Box $im 18 22 2 1 'gold'
 if($pose -eq 'idle') {
  Box $im 13 25 3 4 'skin';Box $im 20 25 3 4 'skin'
  Box $im 12 28 4 3 'boot';Box $im 19 28 5 3 'boot'
  Box $im 12 28 4 1 'cream';Box $im 19 28 4 1 'cream'
  Box $im 11 21 3 3 'skin';Box $im 22 20 3 3 'skin'
 } elseif($pose -eq 'run') {
  Poly $im @(14,25,17,25,14,28,10,30,8,28,12,27) 'skin'
  Poly $im @(20,25,23,25,24,28,27,28,27,31,22,31,21,28) 'boot'
  Box $im 7 28 5 3 'boot';Box $im 22 18 5 3 'skin';Box $im 10 22 3 3 'skin'
 } else {
  Poly $im @(14,25,17,25,16,28,12,29,10,27) 'skin'
  Box $im 9 27 5 3 'boot';Box $im 20 24 3 3 'skin';Box $im 21 26 5 3 'boot'
  Box $im 23 15 3 5 'coat';Box $im 24 13 3 3 'skin';Box $im 10 20 3 3 'skin'
 }
 return ,$im
}
$poses=@('idle','run','jump');$heroes=@()
$sheet=New-Canvas 96 32
for($i=0;$i -lt 3;$i++){$h=Hero $poses[$i];$heroes+=,$h;Save $h ('bonney-'+$poses[$i]+'.png');Paste $sheet $h ($i*32) 0}
Save $sheet 'bonney-poses.png'
$tiles=@()
for($t=0;$t -lt 8;$t++){
 $im=New-Canvas 16 16
 switch($t){
  0 {Box $im 0 0 16 16 'darkstone';Box $im 0 0 16 3 'cream';Box $im 1 4 14 10 'stone';Box $im 2 5 10 1 '#94a4a5';Box $im 13 6 1 6 'darkstone'}
  1 {Box $im 0 0 16 16 'darkstone';Box $im 1 1 14 6 'stone';Box $im 1 9 7 6 'stone';Box $im 10 9 5 6 'stone'}
  2 {Box $im 0 0 16 7 'ink';Box $im 1 1 14 4 'woodlight';Box $im 1 5 14 1 'wood';Box $im 4 1 1 4 'coat';Box $im 12 1 1 4 'coat'}
  3 {Box $im 0 0 16 16 'water';Box $im 0 0 8 2 'cream';Box $im 8 2 8 2 'cream';Box $im 3 8 7 1 '#60d4d1';Box $im 0 13 4 1 '#60d4d1'}
  4 {Box $im 1 1 14 15 'ink';Box $im 2 2 12 13 'wood';Box $im 2 2 12 2 'woodlight';Box $im 2 12 12 2 'woodlight';for($a=0;$a -lt 10;$a++){Box $im ($a+3) ($a+3) 2 2 'woodlight'}}
  5 {Box $im 3 1 10 14 'ink';Box $im 4 2 8 12 'wood';Box $im 4 4 8 2 'stone';Box $im 4 10 8 2 'stone';Box $im 6 2 1 12 'woodlight'}
  6 {Poly $im @(6,1,10,1,13,4,13,11,10,14,6,14,3,11,3,4) 'ink';Box $im 5 3 6 9 'gold';Box $im 6 4 2 7 'cream';Box $im 10 5 1 6 'orange'}
  7 {Poly $im @(4,5,8,3,12,5,14,9,11,14,5,14,2,10) 'ink';Box $im 4 6 8 6 'hair';Box $im 5 7 2 2 'light';Box $im 9 10 2 2 'shade';Box $im 8 1 2 4 'gold';Box $im 10 1 3 2 '#74a860'}
 }
 $tiles+=,$im
}
$atlas=New-Canvas 128 16
for($i=0;$i -lt 8;$i++){Paste $atlas $tiles[$i] ($i*16) 0}
Save $atlas 'harbor-tiles.png'
$level=New-Canvas 384 216
Box $level 0 0 384 216 '#89cfdd'
# Distant town and sea, intentionally quiet behind the playfield.
Box $level 0 112 384 104 'water'
for($i=0;$i -lt 12;$i++){
 $x=$i*36-8;$height=25+($i%4)*9
 Box $level $x (112-$height) 27 $height '#bbd8d5'
 Box $level $x (110-$height) 27 3 '#a2bdba'
 Box $level ($x+6) (118-$height) 3 5 '#8ab5bd';Box $level ($x+17) (118-$height) 3 5 '#8ab5bd'
}
for($i=0;$i -lt 7;$i++){Box $level ($i*59) (130+($i%3)*14) 28 1 '#56bcc5'}
for($x=0;$x -lt 384;$x+=16){
 if($x -lt 112 -or $x -ge 208){
  Paste $level $tiles[0] $x 176
  Paste $level $tiles[1] $x 192
 }
 Paste $level $tiles[3] $x 208
}
for($x=128;$x -lt 192;$x+=16){Paste $level $tiles[2] $x 144}
Box $level 132 151 4 57 'coat';Box $level 184 151 4 57 'coat'
Paste $level $heroes[0] 48 144
Paste $level $tiles[7] 157 119
Paste $level $tiles[6] 104 145;Paste $level $tiles[6] 123 124;Paste $level $tiles[6] 143 108
Paste $level $tiles[4] 286 160;Paste $level $tiles[5] 320 160
# Enemy silhouette sample: not a final animation.
Box $level 251 151 10 8 'navy';Box $level 252 149 10 3 'white'
Box $level 253 153 7 6 'skin';Box $level 251 160 11 9 'blue'
Box $level 251 169 4 7 'navy';Box $level 259 169 4 7 'navy'
Box $level 249 163 5 3 'skin';Box $level 260 163 5 3 'skin'
Box $level 359 125 2 51 'wood';Poly $level @(361,126,376,126,376,140,361,137) 'hair'
for($i=0;$i -lt 3;$i++){
 $x=10+$i*13
 Poly $level @($x,10,($x+3),8,($x+5),10,($x+8),8,($x+11),10,($x+11),14,($x+5),20,$x,14) 'ink'
 Poly $level @(($x+1),11,($x+3),10,($x+5),12,($x+8),10,($x+10),11,($x+10),14,($x+5),18,($x+1),14) 'hair'
}
Save $level 'harbor-screen-384x216.png'
$large=New-Canvas 1536 864;Paste $large $level 0 0 4;Save $large 'harbor-screen-4x.png'
$board=New-Canvas 960 480;Box $board 0 0 960 480 'navy'
for($i=0;$i -lt 3;$i++){Paste $board $heroes[$i] (32+$i*210) 32 6;Paste $board $heroes[$i] (100+$i*210) 240 1}
for($i=0;$i -lt 8;$i++){Paste $board $tiles[$i] (32+$i*112) 320 6}
Save $board 'pixel-review-board.png'
@{
 character=@{cellWidth=32;cellHeight=32;frames=@('idle','run-study','jump-study');productionReady=$false}
 tiles=@{cellWidth=16;cellHeight=16;names=@('quay-top','stone-fill','platform','water','crate','barrel','coin','transform-pickup')}
 viewport=@{width=384;height=216}
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $out 'manifest.json')
Write-Output "Created pixel studies in $out"
