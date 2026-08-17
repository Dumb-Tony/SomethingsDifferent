# scratch: build _newprops.html = game + the three new kinds. Not shipped.
$ErrorActionPreference = "Stop"
$root  = Split-Path $PSScriptRoot -Parent
$scr   = "C:\Users\wabba\AppData\Local\Temp\claude\C--Users-wabba-Downloads-Claude\dd735da8-01c7-40ff-9255-cd85ef4a8135\scratchpad"
$html  = Get-Content (Join-Path $root "somethingsdifferent.html") -Raw -Encoding UTF8
$kinds = Get-Content (Join-Path $scr "newkinds.txt") -Raw -Encoding UTF8
$build = Get-Content (Join-Path $scr "newbuild.txt") -Raw -Encoding UTF8

$aK = "          w:{t:'num',min:0.30,max:0.46,sal:0.50}}},"
$aB = "      wr.position.set(0,h*0.275,d*0.72);g.add(wr);"

$nK = ([regex]::Matches($html,[regex]::Escape($aK))).Count
$nB = ([regex]::Matches($html,[regex]::Escape($aB))).Count
if ($nK -ne 1 -or $nB -ne 1) { Write-Host "anchor not unique: kinds=$nK build=$nB" -ForegroundColor Red; exit 2 }

# PROP_KINDS: append after the keyboard entry, before the closing };
$html = $html.Replace($aK + "`r`n};", $aK + "`r`n" + $kinds.TrimEnd() + "`r`n};")
# PROP_BUILD: keyboard() is last and has no trailing comma - add one, then append
$html = $html.Replace($aB + "`r`n    }`r`n    return g;`r`n  }`r`n};",
                      $aB + "`r`n    }`r`n    return g;`r`n  },`r`n`r`n" + $build.TrimEnd() + "`r`n};")

if ($html -notmatch 'doormat:\{alienName') { Write-Host "KINDS insert failed" -ForegroundColor Red; exit 2 }
if ($html -notmatch '  doormat\(s\)\{')    { Write-Host "BUILD insert failed" -ForegroundColor Red; exit 2 }

Set-Content -Path (Join-Path $root "_newprops.html") -Value $html -Encoding utf8
Write-Host "wrote _newprops.html" -ForegroundColor Green
