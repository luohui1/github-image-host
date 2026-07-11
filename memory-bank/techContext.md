# Tech Context

## Stack
- GitHub public repository: image storage
- jsDelivr CDN: `cdn.jsdelivr.net/gh/...`
- PowerShell: `upload.ps1` upload helper
- Git / GitHub CLI (`gh`): repo create and push

## Development Setup
```powershell
cd D:\Flies\github-image-host
.\upload.ps1 .\demo.png
```

## Constraints
- Prefer files under 5MB
- Repo must be public for reliable CDN access
- Not for abuse / high-volume hosting

## Environment
- GitHub account: luohui1
- Local path: D:\Flies\github-image-host
