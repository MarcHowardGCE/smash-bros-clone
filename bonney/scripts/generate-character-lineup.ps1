# Reuse drawing helpers without running the earlier study generator.
$helpers = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'generate-pixel-study.ps1'))
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$start = $helpers.IndexOf('$pal =')
. ([scriptblock]::Create($helpers.Substring($start, $helpers.IndexOf('function Hero(') - $start)))
$out = Join-Path $root 'assets\character-lineup-v1'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$pal['purple']='#68438a';$pal['purplelight']='#ac80c7';$pal['purpledark']='#47315f'
$pal['green']='#5d946e';$pal['greenlight']='#a4c49a'
function Character($age,$outfit) {
 $im=New-Canvas 32 32
 $top=@{baby=10;teenage=5;adult=1}[$age]
 $head=$top+3;$neck=$head+8;$waist=$neck+@{baby=4;teenage=5;adult=6}[$age]
 # Hair behind head and shoulders.
 Poly $im @(10,$head,13,($head-2),21,($head-2),24,($head+2),23,($neck+4),20,($waist+1),8,($waist+1),8,($neck+2)) 'ink'
 Poly $im @(11,$head,14,($head-1),20,($head-1),22,($head+2),21,($neck+4),18,$waist,9,$waist,10,($neck+1)) 'hair'
 Box $im 10 ($head+3) 2 ($waist-$head-3) 'light'
 # Legs and shared foot anchor (last opaque row = 30).
 Box $im 13 $waist 4 (30-$waist) 'ink';Box $im 20 $waist 4 (30-$waist) 'ink'
 if($outfit -eq 'egghead'){
  Box $im 13 $waist 3 (29-$waist) 'purple';Box $im 20 $waist 3 (29-$waist) 'purple'
  Box $im 12 27 5 4 'purpledark';Box $im 19 27 6 4 'purpledark'
  Box $im 13 27 3 3 'purple';Box $im 20 27 3 3 'purple'
  Box $im 12 27 4 1 'purplelight';Box $im 19 27 5 1 'purplelight'
  Box $im 12 28 1 2 'gold';Box $im 19 28 1 2 'gold'
 } else {
  Box $im 13 $waist 3 (28-$waist) 'shade';Box $im 20 $waist 3 (28-$waist) 'cream'
  for($y=$waist+1;$y -lt 27;$y+=3){Box $im 20 $y 3 1 'purple';Box $im 14 $y 1 1 'gold'}
  Box $im 12 27 5 4 'boot';Box $im 19 27 6 4 'boot'
  Box $im 13 28 1 2 'tan';Box $im 20 28 1 2 'tan'
 }
 # Fully covering outfit, consistent silhouette within each age.
 Poly $im @(13,$neck,20,$neck,23,($neck+2),24,$waist,12,($waist+1),10,($neck+3)) 'ink'
 if($outfit -eq 'egghead'){
  Poly $im @(13,$neck,20,$neck,22,($neck+2),22,$waist,13,$waist,11,($neck+3)) 'purple'
  Box $im 17 ($neck+1) 1 ($waist-$neck-1) 'purplelight'
  Box $im 17 ($waist-1) 2 1 'gold'
  Box $im 10 ($neck+2) 3 ($waist-$neck) 'purpledark'
  Box $im 22 ($neck+2) 3 ($waist-$neck) 'purple'
  Box $im 10 $waist 3 2 'purpledark';Box $im 22 $waist 3 2 'purpledark'
  Box $im 12 ($neck+1) 2 1 'purplelight'
 } else {
  Box $im 15 ($neck+1) 6 ($waist-$neck-1) 'white'
  Box $im 11 ($neck+1) 4 ($waist-$neck) 'coat';Box $im 21 ($neck+1) 3 ($waist-$neck) 'coat'
  Box $im 11 ($neck+1) 3 1 'tan';Box $im 21 ($neck+1) 3 1 'tan'
  Box $im 13 ($waist-1) 9 2 'orange'
  Box $im 15 ($waist-1) 1 2 'ink';Box $im 19 ($waist-1) 1 2 'ink'
  Box $im 17 ($waist-2) 2 1 'gold'
  Box $im 10 ($waist-1) 3 2 'skin';Box $im 23 ($waist-1) 2 2 'skin'
 }
 # Face, pink fringe, earring. Large readable eye.
 Poly $im @(15,$head,21,$head,23,($head+3),23,($head+7),20,($head+9),15,($head+7)) 'skin'
 Box $im 16 $head 6 1 'skinshade';Box $im 14 $head 2 7 'hair'
 Box $im 15 $head 2 2 'light';Box $im 21 ($head+3) 2 3 'ink'
 Box $im 21 ($head+3) 1 1 'white';Box $im 22 ($head+7) 2 1 'skinshade'
 Box $im 15 ($head+6) 1 2 'gold'
 if($outfit -eq 'captain'){
  Poly $im @(8,($top+3),11,$top,21,$top,24,($top+3),23,($top+6),18,($top+6),9,($top+7)) 'ink'
  Poly $im @(9,($top+3),12,($top+1),20,($top+1),23,($top+3),22,($top+5),10,($top+6)) 'green'
  Poly $im @(17,($top+1),19,($top+1),16,($top+5),10,($top+6),10,($top+5),15,($top+4)) 'greenlight'
 } else {
  Box $im 11 ($head+3) 3 5 'purpledark';Box $im 12 ($head+4) 2 3 'purplelight'
  Box $im 12 ($top-1) 1 6 'purpledark';Box $im 12 ($top-1) 1 1 'gold'
 }
 return ,$im
}
function Label($im,$text,$x,$y,$size=12){
 $g=[System.Drawing.Graphics]::FromImage($im);$g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::SingleBitPerPixelGridFit
 $font=[System.Drawing.Font]::new('Consolas',$size,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
 $brush=[System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#e9e8ec'))
 $g.DrawString($text,$font,$brush,$x,$y);$font.Dispose();$brush.Dispose();$g.Dispose()
}
$sheet=New-Canvas 96 64
$board=New-Canvas 1040 720;Box $board 0 0 1040 720 '#172538'
Label $board 'BONNEY / AGE + POWER-UP LINEUP' 28 16 22
Label $board '32x32 cells | shared foot anchor | identical normal movement' 28 48 14
$ages=@('baby','teenage','adult');$outfits=@('egghead','captain');$records=@()
for($row=0;$row -lt 2;$row++){
 Label $board (@('EGGHEAD / FLIGHT','PIRATE CAPTAIN / CANNONBALL')[$row]) 28 (90+$row*308) 18
 for($col=0;$col -lt 3;$col++){
  $age=$ages[$col];$outfit=$outfits[$row];$im=Character $age $outfit
  $name="$outfit-$age-idle.png";Save $im $name
  Paste $sheet $im ($col*32) ($row*32)
  $x=70+$col*330;$y=125+$row*308
  Box $board ($x-10) $y 212 204 '#22354b'
  Box $board ($x-10) ($y+192) 212 1 '#536578'
  Paste $board $im $x $y 6
  Paste $board $im ($x+224) ($y+160)
  Label $board ($age.ToUpper()+' / '+($col+1)+' HIT'+$(if($col -gt 0){'S'})) ($x-4) ($y+214) 16
  $records+=@{file=$name;age=$age;powerUp=$outfit;frame=@{x=$col*32;y=$row*32;width=32;height=32};anchor=@{x=16;y=31}}
  $im.Dispose()
 }
}
Save $sheet 'bonney-six-idles.png';Save $board 'bonney-lineup-review.png'
@{cellWidth=32;cellHeight=32;status='idle design studies, not animated';frames=$records} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $out 'manifest.json')
# Validate transparency, bounds, unique designs and fixed foot baseline.
$hashes=@()
foreach($record in $records){
 $im=[System.Drawing.Bitmap]::FromFile((Join-Path $out $record.file))
 if($im.Width -ne 32 -or $im.Height -ne 32){throw 'Invalid cell'}
 $last=-1;$opaque=0
 for($y=0;$y -lt 32;$y++){for($x=0;$x -lt 32;$x++){
  $a=$im.GetPixel($x,$y).A
  if($a -ne 0 -and $a -ne 255){throw 'Non-binary alpha'}
  if($a -eq 255){$last=$y;$opaque++}
 }}
 if($last -ne 30 -or $opaque -eq 0){throw 'Invalid baseline or empty sprite'}
 $im.Dispose()
 $hashes+=(Get-FileHash -LiteralPath (Join-Path $out $record.file) -Algorithm SHA256).Hash
}
if(($hashes|Select-Object -Unique).Count -ne 6){throw 'Duplicate design'}
Write-Output 'PASS: six unique 32x32 sprites; binary alpha; common opaque baseline y=30.'
