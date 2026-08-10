# TruthNewsApp

TruthNewsApp is an account-free, local-first Windows desktop application for reading Christian and conservative news beside Scripture, historical timelines, dispensational frameworks, and carefully qualified prophecy records.

## What works

- Reference-matched dark-gold dashboard plus a white-gold theme
- Local SQLite-compatible persistence through `sql.js`
- Thirteen searchable offline Bible editions with chapter navigation, translation-aware search, copy, bookmarks, and notes
- Local Geneva Bible 1560 historical facsimile with honest scan-only labeling
- Master, historical, biblical, prophetic, and Jesus-life timelines
- Evidence drawers and explicit confidence states for prophecy records
- Publisher-attributed RSS synchronization with manual refresh and per-source controls
- Global search across Scripture, history, prophecy, dispensations, sources, and cached news
- Local bookmarks, notes, preferences, cache controls, and activity reset
- Secure Electron boundary with context isolation, sandboxing, no renderer Node access, and validated IPC

## Development

Requirements: Windows and Node.js 24 or newer.

```powershell
npm install
npm run dev
```

Validation commands:

```powershell
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Build the Windows installer:

```powershell
npm run dist:win
```

The NSIS installer is written to `release/`. It creates Start Menu and optional desktop shortcuts and allows the destination folder to be changed.

## Local data and privacy

No sign-in is required. The database is stored beneath Electron's Windows `userData` directory for TruthNewsApp. News synchronization is the only routine network activity; offline Scripture, translation packs, the Geneva facsimile, timelines, bookmarks, notes, settings, and previously cached metadata remain available without a connection. Additional text editions import into the local database only when selected. External resources open in the system browser and cannot navigate the application window.

## Content boundaries

Historical and prophetic material distinguishes source claims, Scripture references, interpretive framework, and confidence. News summaries remain publisher-attributed. The application does not fabricate a prophecy match when no reviewed link exists. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for bundled-content provenance and rights notes.
