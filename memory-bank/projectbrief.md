# Project Brief

## Overview
Personal free image host using a public GitHub repository and jsDelivr CDN. No self-owned server.

## Core Requirements
- Store images in `images/` on GitHub
- Serve via jsDelivr CDN links
- One-command upload on Windows (PowerShell)

## Goals
- Zero server cost
- Simple upload → commit → push → CDN URL workflow

## Scope
### In Scope
- Public GitHub repo image storage
- `upload.ps1` helper
- jsDelivr / raw.githubusercontent.com URLs

### Out of Scope
- High-traffic public image hosting
- Image processing / compression pipeline
- Private repo CDN (jsDelivr needs public content)
