<div align="center">

<img src="resources/icon.png" alt="Study Garden icon" width="112" />

# 🌸 Study Garden 🌸

### *A cozy little place to grow your knowledge.*

<p>
  <img src="https://img.shields.io/badge/version-1.0-ff8fab?style=flat-square" alt="Version 1.0" />
  <img src="https://img.shields.io/badge/status-finished-ff69a4?style=flat-square" alt="Finished" />
  <img src="https://img.shields.io/badge/desktop%20app-Electron-ffb3c6?style=flat-square&logo=electron&logoColor=white" alt="Electron desktop app" />
</p>

<p>🌷 Log your sessions · 🌱 collect concepts · ✨ review what you learned</p>

</div>

<br />

## 💗 About the app

Study Garden is a finished desktop study companion for keeping track of learning sessions, concepts, notes, and flashcards in one calm, friendly space.

This is the **v1.0 portfolio release**. The main experience is complete and ready to download. Future changes will be limited to small polish improvements, maintenance, or bug fixes.

## 🎀 Download and try it

You do **not** need VS Code, Node.js, or any programming tools to use the app.

Open the [latest GitHub Release](https://github.com/ninabtolo/studying-log-app/releases/latest) and download the file that matches your computer from the **Assets** section:

| Your computer | Download this file | What to do |
| --- | --- | --- |
| **macOS** | The file ending in `.dmg` | Open it and drag **Study Garden** to Applications. |
| **Windows** | The file ending in `-setup.exe` | Open it and follow the installation steps. |

<div align="center">

🌸 <strong>Download → open → start growing your study garden.</strong> 🌸

</div>

> **macOS note:** Since this is an independently distributed portfolio app and is not notarized yet, macOS may show a security warning. If that happens, right-click the app, choose **Open**, and confirm.

> **Windows note:** Windows may say it **protected your PC** because this is a new app with only a few downloads and it is not code-signed yet. If the download is blocked, click **More info** first, then choose **Keep anyway**. When opening the installer, click **More info → Run anyway** in Windows SmartScreen. These warnings are caused by the app's low downloada, not by a missing application file.

Study data is stored locally on your computer. No account, server, or internet connection is required.

## ✨ Features

- Create study sessions with a subject, date, duration, and notes.
- Add concepts and personal notes to each session.
- Create concept or question flashcards while studying.
- Review flashcards by switching between the front and answer.
- Open flashcards in a focused review modal with a gentle typing animation.
- See total sessions, study time, concepts, and flashcards at a glance.
- Track sessions and total study time by subject.
- Edit or delete sessions whenever your notes change.
- Keep everything private and local with SQLite persistence.

### 🌷 See it in action

<div align="center">

<table>
  <tr>
    <td align="center" width="50%">
      <strong>🌱 Create a study session</strong><br /><br />
      <img src="resources/Screen-Recording-2026-10-03-at-9.38.19 PM (1).gif" alt="Creating a study session" width="100%" />
    </td>
    <td align="center" width="50%">
      <strong>📚 Explore your study history</strong><br /><br />
      <img src="resources/Screen-Recording-2026-10-03-at-9.39.27 PM (1).gif" alt="Exploring study history" width="100%" />
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <strong>✨ Review flashcards</strong><br /><br />
      <img src="resources/Screen-Recording-2026-10-03-at-9.41.01 PM (1).gif" alt="Reviewing flashcards" width="100%" />
    </td>
    <td align="center" width="50%">
      <strong>🌸 Track your progress</strong><br /><br />
      <img src="resources/Screen-Recording-2026-10-03-at-9.42.20 PM.gif" alt="Tracking study progress" width="100%" />
    </td>
  </tr>
</table>

</div>

## 🌼 Why Study Garden?

The goal was to make study tracking feel less like filling out a spreadsheet and more like caring for a small personal garden: simple, visual, private, and rewarding to return to.

## 🧺 Built with

<div align="center">

`Electron` · `React` · `TypeScript` · `Vite` · `SQLite`

</div>

<details>
<summary>🌱 Run the project from source</summary>

### Requirements

- Node.js and npm
- A compatible development environment

A recent Node.js LTS version is recommended.

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### Development

Start the application with Vite and hot reload:

```bash
npm run dev
```

Open an already-built version:

```bash
npm run start
```

### Validation

```bash
npm run typecheck
npm run lint
npm run format
```

### Build installers

```bash
# Build compiled files
npm run build

# Create an unpacked app for local testing
npm run build:unpack

# Create a platform installer
npm run build:mac
npm run build:win
npm run build:linux
```

Generated build artifacts are placed in `dist/`.

### Project structure

```text
src/
├── main/       # Electron main process and SQLite access
├── preload/    # Secure API exposed to the renderer
└── renderer/   # React user interface
resources/      # Icons, illustrations, and demo GIFs
```

</details>

## 💌 Local data

The app creates a local `study-log.sqlite` database automatically inside Electron's user data directory. Sessions, concepts, and flashcards remain available between launches and are never sent to a server.

## 💖 License

This is a personal portfolio project. No formal license has been defined yet.

<div align="center">

🌷 Thank you for visiting Study Garden 🌷

</div>
