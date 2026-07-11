# Active Context

## Current Focus
Image host is live; ready for daily uploads via upload.ps1.

## Recent Changes
- Created public repo https://github.com/luohui1/github-image-host
- Pushed scaffold + demo.svg
- Fixed push auth with `gh auth setup-git`

## Next Steps
1. Use `.\upload.ps1 <image>` for new images
2. Prefer jsDelivr URL; raw.githubusercontent.com as fallback

## Active Decisions
- Repo: luohui1/github-image-host (public, main)

## Blockers
- Local `D:\APPS\Git` may miss `git-remote-https`; prefer `C:\Program Files\Git` or keep gh credential helper working
