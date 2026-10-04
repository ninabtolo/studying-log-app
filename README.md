<div align="center">

<img src="resources/icon.png" alt="Study Log icon" width="96" />

# 🌸 Study Log 🌸

### *A tiny study garden for growing knowledge, one session at a time.*

<p>
  <img src="https://img.shields.io/badge/status-in%20progress-ff8fab?style=flat-square" alt="Status: in progress" />
  <img src="https://img.shields.io/badge/Electron-39.8.10-ffb3c6?style=flat-square&logo=electron&logoColor=white" alt="Electron 39.8.10" />
  <img src="https://img.shields.io/badge/React-19.2.1-ffc8dd?style=flat-square&logo=react&logoColor=white" alt="React 19.2.1" />
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-ff8fab?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5.9.3" />
</p>

<p>🌷 Log your progress · 🌱 collect concepts · ✨ review what you learned</p>

</div>

<br />

Desktop application for logging study sessions, organizing concepts, and reviewing flashcards. The project is built with Electron, React, and TypeScript, with local SQLite persistence.

## 🌷 Features

- Create study sessions with a subject, date, duration, and general notes.
- Add studied concepts and notes to each session.
- Create two types of flashcards: concept or question.
- Review flashcards directly from the study history by switching between the front and answer.
- View overall statistics for sessions, total study time, concepts, and flashcards.
- See session and study-time totals grouped by subject.
- Edit or delete existing sessions.
- Store data locally without requiring a server or account.

## 🧺 Tech stack

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) through `electron-vite`
- [SQLite](https://www.sqlite.org/) through `better-sqlite3`
- [electron-builder](https://www.electron.build/) for creating installers

## 💌 Requirements

- Node.js and npm.
- An environment compatible with the platform where the application will run.

A recent Node.js LTS version is recommended.

## 🌱 Installation

Clone the repository and install the dependencies:

```bash
npm install
```

The `postinstall` script automatically installs the native dependencies required by Electron.

## 🛠️ Development

Start the application in development mode with Vite and hot reload:

```bash
npm run dev
```

To open an already-built version:

```bash
npm run start
```

## ✨ Validation and code quality

Check TypeScript types:

```bash
npm run typecheck
```

Run ESLint:

```bash
npm run lint
```

Format the project files:

```bash
npm run format
```

## 📦 Build and distribution

Build the compiled application files:

```bash
npm run build
```

Create an unpacked build for testing:

```bash
npm run build:unpack
```

Create an installer for a specific platform:

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Generated artifacts are placed in the `dist/` directory.

## 🗃️ Local data

The database is created automatically in Electron's user data directory, in a file named `study-log.sqlite`. The required tables are created automatically on first launch.

Sessions, concepts, and flashcards are stored locally and remain available between application launches. Deleting a session also removes its associated concepts and flashcards.

## 🌼 Project structure

```text
src/
├── main/       # Electron main process and SQLite access
├── preload/    # Secure API exposed to the renderer
└── renderer/   # React user interface
resources/      # Icons and visual assets
```

Data access happens through IPC between the renderer and main process. The interface does not access SQLite directly.

## 🎀 Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development environment |
| `npm run start` | Open the compiled application in preview mode |
| `npm run build` | Run type checking and compile the project |
| `npm run build:unpack` | Generate an unpacked build |
| `npm run build:win` | Build the Windows package |
| `npm run build:mac` | Build the macOS package |
| `npm run build:linux` | Build the Linux package |
| `npm run typecheck` | Validate TypeScript types |
| `npm run lint` | Run ESLint |
| `npm run format` | Format files with Prettier |

## 💗 License

This project does not have a license defined yet.
