# Product Context

## Problem Statement
Need a free image host without owning a server.

## Solution
Push images to a public GitHub repo and use jsDelivr as CDN.

## User Experience
Drop an image path into `upload.ps1`, get a clipboard-ready CDN URL.

## Success Criteria
- Upload works with one PowerShell command
- Returned URL is publicly accessible via jsDelivr
