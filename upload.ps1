<#
.SYNOPSIS
  Upload an image to this GitHub image host and print the jsDelivr URL.

.EXAMPLE
  .\upload.ps1 .\photo.png
  .\upload.ps1 C:\Users\guo\Pictures\a.jpg -Name avatar
#>
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Path,

  [Parameter()]
  [string]$Name,

  [Parameter()]
  [switch]$NoPush
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

if (-not (Test-Path -LiteralPath $Path)) {
  throw "File not found: $Path"
}

$src = Get-Item -LiteralPath $Path
$allowed = @(".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico")
$ext = $src.Extension.ToLowerInvariant()
if ($allowed -notcontains $ext) {
  throw "Unsupported type: $ext. Allowed: $($allowed -join ', ')"
}

# Keep files reasonably small for GitHub + jsDelivr
$maxBytes = 5MB
if ($src.Length -gt $maxBytes) {
  throw "File too large ($([math]::Round($src.Length / 1MB, 2)) MB). Keep under 5 MB."
}

$imagesDir = Join-Path $repoRoot "images"
if (-not (Test-Path $imagesDir)) {
  New-Item -ItemType Directory -Path $imagesDir | Out-Null
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$base = if ($Name) {
  ($Name -replace '[^\w\-]+', '-').Trim('-').ToLowerInvariant()
} else {
  [System.IO.Path]::GetFileNameWithoutExtension($src.Name) -replace '[^\w\-]+', '-'
}
if ([string]::IsNullOrWhiteSpace($base)) { $base = "img" }

$destName = "$base-$stamp$ext"
$destPath = Join-Path $imagesDir $destName
Copy-Item -LiteralPath $src.FullName -Destination $destPath -Force

git add -- "images/$destName"
$msg = "upload: $destName"
git commit -m $msg | Out-Null

$remote = (git remote get-url origin 2>$null)
if (-not $remote) {
  Write-Host "Committed locally: images/$destName"
  Write-Host "No git remote yet. Create the GitHub repo first, then re-run push."
  exit 0
}

# Parse owner/repo from origin URL
if ($remote -match 'github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)') {
  $owner = $Matches.owner
  $repo = $Matches.repo
} else {
  throw "Cannot parse GitHub owner/repo from remote: $remote"
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()

if (-not $NoPush) {
  git push -u origin HEAD
}

$cdn = "https://cdn.jsdelivr.net/gh/$owner/$repo@$branch/images/$destName"
$raw = "https://raw.githubusercontent.com/$owner/$repo/$branch/images/$destName"

Write-Host ""
Write-Host "Uploaded: images/$destName"
Write-Host "jsDelivr : $cdn"
Write-Host "GitHub   : $raw"
Write-Host ""

try {
  Set-Clipboard -Value $cdn
  Write-Host "jsDelivr URL copied to clipboard."
} catch {
  # Clipboard may be unavailable in some shells
}
