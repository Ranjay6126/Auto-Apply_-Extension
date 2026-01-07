Add-Type -AssemblyName System.Drawing

$size = 128
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::Transparent)

$fontFamily = New-Object System.Drawing.FontFamily "Segoe UI Emoji"
# 0 = Regular, 2 = Pixel unit
$font = New-Object System.Drawing.Font $fontFamily, 80, 0, 2

$brush = [System.Drawing.Brushes]::Black

$rect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center

# Construct emoji string using surrogate pair for U+1F4DD (📝)
$emoji = [char]0xD83D + [char]0xDCDD

$g.DrawString($emoji, $font, $brush, $rect, $format)

$bmp.Save("c:\Users\HatBoy\Desktop\AutoApply\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
