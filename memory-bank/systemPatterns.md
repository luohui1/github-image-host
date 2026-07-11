# System Patterns

## Architecture
Local file → `images/` → git commit/push → jsDelivr CDN URL

## Key Patterns
### Content-addressed-ish filenames
- Purpose: avoid overwrite collisions
- Implementation: `{name}-{yyyyMMdd-HHmmss}{ext}`

### Dual URL output
- jsDelivr for CDN
- raw.githubusercontent.com as fallback

## Design Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Public GitHub + jsDelivr | Free, no server | 2026-07-11 |
| PowerShell uploader | User is on Windows | 2026-07-11 |
