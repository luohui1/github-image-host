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

function Resolve-GitExe {
  $candidates = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "D:\APPS\Git\cmd\git.exe"
  )
  foreach ($c in $candidates) {
    if (Test-Path -LiteralPath $c) {
      $helper = Join-Path (Split-Path (Split-Path $c)) "mingw64\libexec\git-core\git-remote-https.exe"
      if ((Test-Path -LiteralPath $helper) -or ($c -like "*Program Files*")) {
        return $c
      }
    }
  }
  $fromPath = Get-Command git -ErrorAction SilentlyContinue
  if ($fromPath) { return $fromPath.Source }
  throw "Git not found. Install Git for Windows."
}

$Git = Resolve-GitExe

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

function Update-Manifest {
  param([string]$Dir)
  $files = Get-ChildItem -LiteralPath $Dir -File |
    Where-Object { $_.Name -match '\.(png|jpe?g|gif|webp|svg|bmp|ico)$' } |
    Sort-Object Name -Descending |
    ForEach-Object { $_.Name }
  $manifest = [ordered]@{
    updatedAt = (Get-Date).ToUniversalTime().ToString("o")
    files     = @($files)
  }
  $json = $manifest | ConvertTo-Json -Depth 5
  Set-Content -LiteralPath (Join-Path $Dir "manifest.json") -Value $json -Encoding utf8
}

Update-Manifest -Dir $imagesDir

& $Git add -- "images/$destName" "images/manifest.json"
$msg = "upload: $destName"
& $Git commit -m $msg | Out-Null

$remote = (& $Git remote get-url origin 2>$null)
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

$branch = (& $Git rev-parse --abbrev-ref HEAD).Trim()

if (-not $NoPush) {
  & $Git push -u origin HEAD
  if ($LASTEXITCODE -ne 0) {
    Write-Host "git push failed; trying gh auth setup-git then retry..."
    gh auth setup-git | Out-Null
    & $Git push -u origin HEAD
    if ($LASTEXITCODE -ne 0) { throw "git push failed" }
  }
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
