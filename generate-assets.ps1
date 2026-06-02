Add-Type -AssemblyName System.Drawing

$assetDir = Resolve-Path (Join-Path $PSScriptRoot "..\outputs\book-shop\assets")

function Color-Hex {
    param([string]$Hex)
    [System.Drawing.ColorTranslator]::FromHtml($Hex)
}

function New-Font {
    param(
        [string]$Family,
        [float]$Size,
        [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
    )
    New-Object System.Drawing.Font($Family, $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Save-Bitmap {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [string]$Name
    )
    $path = Join-Path $assetDir $Name
    $Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $Bitmap.Dispose()
}

function Fill-RoundedRectangle {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.Brush]$Brush,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Radius
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $Radius * 2
    $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
    $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
    $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    $Graphics.FillPath($Brush, $path)
    $path.Dispose()
}

function Draw-BookSpine {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$Y,
        [int]$W,
        [int]$H,
        [string]$Color,
        [string]$Accent
    )
    $body = New-Object System.Drawing.SolidBrush((Color-Hex $Color))
    $line = New-Object System.Drawing.SolidBrush((Color-Hex $Accent))
    $Graphics.FillRectangle($body, $X, $Y, $W, $H)
    $Graphics.FillRectangle($line, $X + [Math]::Max(2, [int]($W * .2)), $Y + 10, 3, $H - 20)
    $Graphics.FillRectangle($line, $X + 4, $Y + $H - 22, $W - 8, 4)
    $body.Dispose()
    $line.Dispose()
}

function Write-CenteredText {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [string]$Color,
        [System.Drawing.RectangleF]$Rect
    )
    $brush = New-Object System.Drawing.SolidBrush((Color-Hex $Color))
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
    $Graphics.DrawString($Text, $Font, $brush, $Rect, $format)
    $format.Dispose()
    $brush.Dispose()
}

function New-HeroImage {
    $w = 1600
    $h = 900
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $wallRect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
    $wallBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($wallRect, (Color-Hex "#f4f7ef"), (Color-Hex "#d9e5dc"), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillRectangle($wallBrush, $wallRect)
    $wallBrush.Dispose()

    $floor = New-Object System.Drawing.SolidBrush((Color-Hex "#6f4e37"))
    $g.FillRectangle($floor, 0, 695, $w, 205)
    $floor.Dispose()

    $shadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 20, 25, 25))
    $g.FillEllipse($shadow, 240, 724, 760, 82)
    $g.FillEllipse($shadow, 930, 720, 390, 58)
    $shadow.Dispose()

    $shelfBrush = New-Object System.Drawing.SolidBrush((Color-Hex "#27483c"))
    $shelfEdge = New-Object System.Drawing.SolidBrush((Color-Hex "#15342b"))
    foreach ($y in @(165, 325, 485)) {
        $g.FillRectangle($shelfBrush, 110, $y, 1380, 26)
        $g.FillRectangle($shelfEdge, 110, $y + 23, 1380, 8)
    }
    $g.FillRectangle($shelfEdge, 95, 140, 28, 398)
    $g.FillRectangle($shelfEdge, 1477, 140, 28, 398)
    $shelfBrush.Dispose()
    $shelfEdge.Dispose()

    $colors = @("#f15b49", "#f7bd3a", "#2d7f68", "#314b74", "#8d5bb3", "#f7f4dc", "#222831")
    $accent = @("#ffffff", "#2a2c2f", "#f7f4dc", "#f7bd3a")
    $xStart = 145
    for ($row = 0; $row -lt 3; $row++) {
        $baseY = 78 + ($row * 160)
        $x = $xStart
        for ($i = 0; $i -lt 38; $i++) {
            $bw = 16 + (($i * 7 + $row * 3) % 22)
            $bh = 74 + (($i * 17 + $row * 9) % 48)
            $color = $colors[($i + $row) % $colors.Count]
            $line = $accent[($i + 2 * $row) % $accent.Count]
            Draw-BookSpine $g $x ($baseY + (120 - $bh)) $bw $bh $color $line
            $x += $bw + 9
            if ($x -gt 1440) { break }
        }
    }

    $table = New-Object System.Drawing.SolidBrush((Color-Hex "#f8f5e8"))
    $tableEdge = New-Object System.Drawing.SolidBrush((Color-Hex "#d3a74f"))
    Fill-RoundedRectangle $g $table 255 590 655 145 18
    $g.FillRectangle($tableEdge, 292, 728, 582, 18)
    $g.FillRectangle($tableEdge, 335, 744, 26, 126)
    $g.FillRectangle($tableEdge, 812, 744, 26, 126)
    $table.Dispose()
    $tableEdge.Dispose()

    Draw-BookSpine $g 355 518 92 106 "#c94d3f" "#ffffff"
    Draw-BookSpine $g 470 492 82 132 "#1f6f53" "#f7bd3a"
    Draw-BookSpine $g 575 530 122 84 "#2f5e8b" "#ffffff"
    Draw-BookSpine $g 716 505 78 109 "#f0b84a" "#222831"

    $sign = New-Object System.Drawing.SolidBrush((Color-Hex "#ffffff"))
    Fill-RoundedRectangle $g $sign 1000 570 380 104 16
    $sign.Dispose()
    $brandFont = New-Font "Georgia" 42 ([System.Drawing.FontStyle]::Bold)
    $smallFont = New-Font "Segoe UI" 20 ([System.Drawing.FontStyle]::Regular)
    Write-CenteredText $g "Leaf & Ledger" $brandFont "#20332d" ([System.Drawing.RectangleF]::new(1018, 584, 344, 42))
    Write-CenteredText $g "Fresh shelves daily" $smallFont "#c94d3f" ([System.Drawing.RectangleF]::new(1018, 626, 344, 30))

    $lampBrush = New-Object System.Drawing.SolidBrush((Color-Hex "#f5c84c"))
    $cordPen = New-Object System.Drawing.Pen((Color-Hex "#20332d"), 5)
    foreach ($cx in @(352, 800, 1248)) {
        $g.DrawLine($cordPen, $cx, 0, $cx, 72)
        $g.FillEllipse($lampBrush, $cx - 54, 64, 108, 42)
        $glow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 245, 200, 76))
        $g.FillEllipse($glow, $cx - 145, 82, 290, 105)
        $glow.Dispose()
    }
    $lampBrush.Dispose()
    $cordPen.Dispose()
    $brandFont.Dispose()
    $smallFont.Dispose()
    $g.Dispose()
    Save-Bitmap $bmp "bookshop-hero.png"
}

function New-BookCover {
    param(
        [string]$FileName,
        [string]$Title,
        [string]$Author,
        [string]$Category,
        [string]$TopColor,
        [string]$BottomColor,
        [string]$AccentColor,
        [int]$Pattern
    )
    $w = 520
    $h = 740
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, (Color-Hex $TopColor), (Color-Hex $BottomColor), [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
    $g.FillRectangle($bg, $rect)
    $bg.Dispose()

    $shade = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 0, 0, 0))
    $g.FillRectangle($shade, 0, 0, 48, $h)
    $shade.Dispose()

    $accentBrush = New-Object System.Drawing.SolidBrush((Color-Hex $AccentColor))
    $softAccent = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(145, (Color-Hex $AccentColor)), 4)
    switch ($Pattern) {
        1 {
            for ($i = -60; $i -lt 760; $i += 90) {
                $g.DrawLine($softAccent, 82, $i, 520, $i + 230)
            }
            $g.FillEllipse($accentBrush, 338, 478, 108, 108)
        }
        2 {
            for ($i = 0; $i -lt 7; $i++) {
                $g.DrawEllipse($softAccent, 120 + ($i * 22), 248 + ($i * 18), 210, 210)
            }
        }
        3 {
            for ($i = 0; $i -lt 5; $i++) {
                $g.FillRectangle($accentBrush, 350 - ($i * 42), 440 + ($i * 23), 124, 18)
            }
            $g.DrawEllipse($softAccent, 100, 210, 330, 330)
        }
        4 {
            $points = @(
                [System.Drawing.Point]::new(260, 190),
                [System.Drawing.Point]::new(426, 408),
                [System.Drawing.Point]::new(260, 628),
                [System.Drawing.Point]::new(94, 408)
            )
            $g.FillPolygon($accentBrush, $points)
            $g.DrawEllipse($softAccent, 146, 292, 228, 228)
        }
        default {
            for ($i = 0; $i -lt 8; $i++) {
                $g.FillEllipse($accentBrush, 94 + ($i * 40), 462 - ($i % 2 * 36), 38, 38)
            }
        }
    }

    $labelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(214, 255, 255, 255))
    Fill-RoundedRectangle $g $labelBrush 72 72 376 520 14
    $labelBrush.Dispose()

    $categoryFont = New-Font "Segoe UI Semibold" 20 ([System.Drawing.FontStyle]::Bold)
    $titleFont = New-Font "Georgia" 51 ([System.Drawing.FontStyle]::Bold)
    $authorFont = New-Font "Segoe UI" 25
    $tinyFont = New-Font "Segoe UI Semibold" 18 ([System.Drawing.FontStyle]::Bold)

    Write-CenteredText $g ($Category.ToUpperInvariant()) $categoryFont "#1f6f53" ([System.Drawing.RectangleF]::new(90, 92, 340, 34))
    Write-CenteredText $g $Title $titleFont "#20262a" ([System.Drawing.RectangleF]::new(92, 168, 336, 240))
    Write-CenteredText $g $Author $authorFont "#4a5550" ([System.Drawing.RectangleF]::new(92, 438, 336, 56))
    Write-CenteredText $g "LEAF & LEDGER" $tinyFont "#c94d3f" ([System.Drawing.RectangleF]::new(92, 526, 336, 30))

    $accentBrush.Dispose()
    $softAccent.Dispose()
    $categoryFont.Dispose()
    $titleFont.Dispose()
    $authorFont.Dispose()
    $tinyFont.Dispose()
    $g.Dispose()
    Save-Bitmap $bmp $FileName
}

New-HeroImage

$covers = @(
    @{ FileName = "quiet-atlas.png"; Title = "The Quiet Atlas"; Author = "Mira Sol"; Category = "Travel"; TopColor = "#1f6f53"; BottomColor = "#dce9f7"; AccentColor = "#f0b84a"; Pattern = 4 },
    @{ FileName = "city-of-margins.png"; Title = "City of Margins"; Author = "Noel Vance"; Category = "Fiction"; TopColor = "#263a63"; BottomColor = "#8d5bb3"; AccentColor = "#f15b49"; Pattern = 1 },
    @{ FileName = "wildflower-physics.png"; Title = "Wildflower Physics"; Author = "June Etta"; Category = "Science"; TopColor = "#f7bd3a"; BottomColor = "#2d7f68"; AccentColor = "#ffffff"; Pattern = 5 },
    @{ FileName = "midnight-cartographer.png"; Title = "Midnight Cartographer"; Author = "Arlo Finch"; Category = "Mystery"; TopColor = "#171f2d"; BottomColor = "#2f5e8b"; AccentColor = "#f0b84a"; Pattern = 2 },
    @{ FileName = "glass-orchard.png"; Title = "The Glass Orchard"; Author = "Selene Park"; Category = "Fantasy"; TopColor = "#dce9f7"; BottomColor = "#c94d3f"; AccentColor = "#1f6f53"; Pattern = 3 },
    @{ FileName = "small-fires.png"; Title = "Small Fires Almanac"; Author = "Ivy Chen"; Category = "Essays"; TopColor = "#ffffff"; BottomColor = "#f15b49"; AccentColor = "#263a63"; Pattern = 5 },
    @{ FileName = "syntax-and-steam.png"; Title = "Syntax & Steam"; Author = "Eli Moreno"; Category = "Tech"; TopColor = "#20262a"; BottomColor = "#d9e5dc"; AccentColor = "#f7bd3a"; Pattern = 1 },
    @{ FileName = "harbor-table.png"; Title = "The Harbor Table"; Author = "Rae Collins"; Category = "Cooking"; TopColor = "#2f5e8b"; BottomColor = "#f8f5e8"; AccentColor = "#c94d3f"; Pattern = 4 }
)

foreach ($cover in $covers) {
    New-BookCover @cover
}
