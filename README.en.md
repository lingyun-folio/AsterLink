<p align="center"><img src="app/icons/app-1024.png" width="112" alt="AsterLink fox mascot"></p>

# AsterLink

Turn your everyday AI tools into desktop companions you can summon.

[中文](README.md) · [Project overview](docs/project-introduction/Project-Introduction-English.md) · [Roadmap](docs/ROADMAP.md)

A **Windows desktop launcher for AI applications**, built with Electron and vanilla JavaScript. Launch local tools from a character roster, view process status, and reopen summoned applications through a floating launcher.

![Character roster](docs/images/roster.png)

> Public source edition 0.3.6 includes AI-assisted MiMo and Lumi characters and a fox app icon. Third-party character illustrations and logos with unverified redistribution permissions are excluded. Screenshots use demo configuration and simulated process states, not live model connections.

## Features

- Character roster: click for details, double-click to summon; multiple agents per character.
- Connection settings: choose the home roster, agent mappings, quotes, and animations.
- Application registry: scan candidates or choose a local executable or shortcut.
- Process indicators: refresh approximately every five seconds.
- Floating launcher: horizontal or vertical layout, dragging, and position lock.
- Tray presence, login startup, optional prewarming, light/dark themes, and adjustable animation duration.

This is a local application launcher. It does not provide unified chat, model API integrations, or automated multi-agent orchestration. Install and configure target applications separately. CC Switch is an optional external tool and is not bundled.

## Getting started

Requirements: Windows 10/11, Node.js 22 or newer, and npm.

```powershell
cd app
npm ci
npm start
```

Choose actual agent paths in Settings; defaults are empty. Assign agents to characters in Connection Settings and enable home-roster visibility. The initial roster is intentionally empty.

The launcher does not require a model API key. Launched tools retain their own account and network requirements. Opening `app/index.html` in a browser provides a visual preview only.

![Connection settings](docs/images/connections.png)

## Stack and development

Electron 33, HTML/CSS/JavaScript, Node.js file and process APIs, contextBridge/IPC, local JSON persistence, Windows tasklist/shell integration, and electron-builder/NSIS. No React, Vue, business backend, or database is required.

Run in `app/`:

```powershell
npm run check
npm run test:config
npm run dist
```

Outputs are generated under `app/dist/`. Publish binaries as GitHub Release assets, not source commits. No code-signing certificate is configured. Windows CI runs source/resource checks and configuration tests; it does not cover the complete GUI or compatibility of every external application.

## Limitations

- Windows-specific integration; macOS and Linux are not supported yet.
- Process presence does not prove window visibility or model readiness.
- Reopening relies on the target application's single-instance behavior.
- The full animation currently dispatches launch after about `4100 × animScale` milliseconds.
- Quoted-path normalization, shortcut argument parsing, and save-error reporting remain improvement areas.
- The legacy `%APPDATA%/星灵枢纽 AetherLink/config.json` path is retained for upgrade compatibility. Never commit user configuration.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [resource notices](THIRD_PARTY_NOTICES.md).

Code and project-owned documentation are distributed under [MIT](LICENSE). Character and icon provenance and permission scope are documented in [ARTWORK.md](docs/ARTWORK.md) and the [resource notices](THIRD_PARTY_NOTICES.md). Dependency licenses remain their own. Third-party application names identify configurable targets only; this project is not affiliated with their vendors and does not distribute their software.

