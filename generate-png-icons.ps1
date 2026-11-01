Add-Type -AssemblyName System.Drawing

function Create-AppIcon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Background rounded squircle / rect
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 12, 15, 23))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Gradient circle in background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $linBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 30, 27, 75),
        [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $pad = [int]($size * 0.05)
    $corner = [int]($size * 0.22)
    
    # Border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 99, 102, 241), [float]($size * 0.02))
    $g.DrawRectangle($pen, $pad, $pad, $size - 2*$pad, $size - 2*$pad)

    # Wallet / Card shape
    $cardX = [int]($size * 0.2)
    $cardY = [int]($size * 0.3)
    $cardW = [int]($size * 0.6)
    $cardH = [int]($size * 0.4)
    $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
    $g.FillRectangle($cardBrush, $cardX, $cardY, $cardW, $cardH)
    
    $cardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 16, 185, 129), [float]($size * 0.02))
    $g.DrawRectangle($cardPen, $cardX, $cardY, $cardW, $cardH)

    # Symbol text
    $font = New-Object System.Drawing.Font("Arial", [float]($size * 0.22), [System.Drawing.FontStyle]::Bold)
    $symBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
    $stringFormat = New-Object System.Drawing.StringFormat
    $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("₹", $font, $symBrush, [float]($cardX + $cardW * 0.35), [float]($cardY + $cardH * 0.5), $stringFormat)

    # Checkmark circle badge
    $badgeR = [int]($size * 0.16)
    $badgeX = [int]($size * 0.72 - $badgeR)
    $badgeY = [int]($size * 0.72 - $badgeR)
    $badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 139, 92, 246))
    $g.FillEllipse($badgeBrush, $badgeX, $badgeY, 2*$badgeR, 2*$badgeR)

    $checkFont = New-Object System.Drawing.Font("Arial", [float]($size * 0.16), [System.Drawing.FontStyle]::Bold)
    $checkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString("✓", $checkFont, $checkBrush, [float]($badgeX + $badgeR), [float]($badgeY + $badgeR), $stringFormat)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $outPath ($size x $size)"
}

Create-AppIcon 192 "public/icon-192.png"
Create-AppIcon 512 "public/icon-512.png"
