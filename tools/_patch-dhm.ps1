# scratch: build _props-dhm.html = game + doormat/houseNumber/mailbox. Not shipped.
$ErrorActionPreference = "Stop"
$root  = Split-Path $PSScriptRoot -Parent
$scr   = "C:\Users\wabba\AppData\Local\Temp\claude\C--Users-wabba-Downloads-Claude\dd735da8-01c7-40ff-9255-cd85ef4a8135\scratchpad"
$html  = Get-Content (Join-Path $root "somethingsdifferent.html") -Raw -Encoding UTF8
$kinds = (Get-Content (Join-Path $scr "newkinds.txt") -Raw -Encoding UTF8).TrimEnd()
$build = (Get-Content (Join-Path $scr "newbuild.txt") -Raw -Encoding UTF8).TrimEnd()

# the game file is LF-only; the inserts are authored LF too
$kinds = $kinds -replace "`r`n","`n"
$build = $build -replace "`r`n","`n"
$aK = "          w:{t:'num',min:0.30,max:0.46,sal:0.50}}},`n};"
$aB = "      wr.position.set(0,h*0.275,d*0.72);g.add(wr);`n    }`n    return g;`n  }`n};"

$nK = ([regex]::Matches($html,[regex]::Escape($aK))).Count
$nB = ([regex]::Matches($html,[regex]::Escape($aB))).Count
if ($nK -ne 1 -or $nB -ne 1) { Write-Host "anchors not unique: kinds=$nK build=$nB" -ForegroundColor Red; exit 2 }

$html = $html.Replace($aK, "          w:{t:'num',min:0.30,max:0.46,sal:0.50}}},`n" + $kinds + "`n};")
$html = $html.Replace($aB, "      wr.position.set(0,h*0.275,d*0.72);g.add(wr);`n    }`n    return g;`n  },`n`n" + $build + "`n};")

if ($html -notmatch 'doormat:\{alienName')  { Write-Host "KINDS insert failed" -ForegroundColor Red; exit 2 }
if ($html -notmatch '(?m)^  doormat\(s\)\{'){ Write-Host "BUILD insert failed" -ForegroundColor Red; exit 2 }

Set-Content -Path (Join-Path $root "_props-dhm.html") -Value $html -Encoding utf8
Write-Host "wrote _props-dhm.html" -ForegroundColor Green
