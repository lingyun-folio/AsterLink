<p align="center"><img src="app/icons/app-1024.png" width="112" alt="AsterLink fox mascot"></p>

# AsterLink

Turn your everyday AI tools into desktop companions you can summon.

[中文](README.md) · [Project overview](docs/project-introduction/Project-Introduction-English.md) · [Roadmap](docs/ROADMAP.md)

A **Windows desktop launcher for AI applications**, built with Electron and vanilla JavaScript. Launch local tools from a character roster, view process status, and reopen summoned applications through a floating launcher.

**For people who prefer the familiar workflows of native agent applications and want to avoid setting up an extra Agent Server.** Register installed desktop applications and keep their own interfaces, accounts, and workflows.

![Character roster](docs/images/roster.png)

> Default artwork uses DeepSeek and MiMo illustrations, with the mystery silhouette for other characters. The DeepSeek asset has a separate CC BY-NC-SA 4.0 license and attribution notice in [Artwork](docs/ARTWORK.md). Screenshots use demo configuration and simulated process states, not live model connections.

> Due to copyright and licensing limits, this project does not include the full set of AI girl character artwork. For other characters, visit [ZipZipPipe on Bilibili](https://space.bilibili.com/4168597) and follow the usage instructions and license for each asset.

## Features

- Character roster: click for details, double-click to summon; multiple agents per character.
- Custom characters: import transparent PNG artwork, edit names and accent colors, and bind agents.
- Connection settings: choose the home roster, agent mappings, quotes, and animations.
- Application registry: scan candidates or choose a local executable or shortcut.
- Application icons: choose a custom PNG for each agent in Settings; the roster and floating launcher share it. Local program icons and letters remain fallbacks.
- Process indicators: refresh approximately every five seconds.
- Floating launcher: horizontal or vertical layout, dragging, and position lock.
- Tray presence, login startup, optional prewarming, light/dark themes, and adjustable animation duration.

This is a local application launcher. It does not provide unified chat, model API integrations, or automated multi-agent orchestration. Install and configure target applications separately. CC Switch is an optional external tool and is not bundled.

## Download

Download the Windows x64 installer or portable edition from [GitHub Releases](https://github.com/lingyun-folio/AsterLink/releases/latest).

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

## Custom artwork

Use **Connection Settings → Add Character** in the desktop app. Import a transparent PNG up to **10 MB**, with both dimensions between **256 and 4096 pixels**. A centered, full-body portrait around **800 × 1600** is recommended. White backgrounds and painted checkerboards are not transparency; automatic background removal is not included.

A glow accent is recommended locally from the artwork. Manual colors are preserved when replacing images; use the recommendation button to switch back to automatic colors. Imported images are copied to local app data, so moving the original file does not break the character. Characters appear in the roster and connection settings and remain available after restarting. Built-in artwork can be replaced or reset; custom characters can be edited or deleted. See the [illustrated guide](docs/CUSTOM_CHARACTERS.md) for details.

## What changed in 0.3.9

- Persistent custom PNG agent icons, shared by the roster and floating launcher.
- Artwork-based accent recommendations and duplicate launcher entries merged by target.
- DeepSeek and MiMo default artwork; mystery placeholders for other characters.
- Correct Windows login-startup state readback and installer output integrity handling.
- Refreshed light-theme screenshots. See [CHANGELOG](CHANGELOG.md).

![Light-theme settings](docs/images/settings.png)

## Stack and development

Electron 33, HTML/CSS/JavaScript, Node.js file and process APIs, contextBridge/IPC, local JSON persistence, Windows tasklist/shell integration, and electron-builder/NSIS. No React, Vue, business backend, or database is required.

Run in `app/`:

```powershell
npm run check
npm run test:config
npm run test:art
npm run dist
```

Outputs are generated in the sibling `AsterLink-build/` directory outside the workspace. No code-signing certificate is configured. Windows CI runs source/resource checks and configuration tests; it does not cover the complete GUI or compatibility of every external application.

## Limitations

- Windows-specific integration; macOS and Linux are not supported yet.
- Process presence does not prove window visibility or model readiness.
- Reopening relies on the target application's single-instance behavior.
- The full animation currently dispatches launch after about `4100 × animScale` milliseconds.
- Quoted-path normalization, shortcut argument parsing, and save-error reporting remain improvement areas.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [resource notices](THIRD_PARTY_NOTICES.md).

Code and project-owned documentation are distributed under [MIT](LICENSE). Character and icon provenance and permission scope are documented in [ARTWORK.md](docs/ARTWORK.md) and the [resource notices](THIRD_PARTY_NOTICES.md). Dependency licenses remain their own. Third-party application names identify configurable targets only; this project is not affiliated with their vendors and does not distribute their software.

