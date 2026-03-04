# AGENT STEVE CLI

[![npm version](https://img.shields.io/npm/v/agent-steve-cli)](https://www.npmjs.com/package/agent-steve-cli)

**Full computer control assistant with beautiful interactive UI** - powered by OpenClaw

---

## 🎯 Features

### 📁 File Operations
- **Read files** - `steve read <file>`
- **Write/create files** - `steve write <file> <content>`
- **Delete files** - `steve delete <file>`
- **List directories** - `steve ls [dir]`
- **Copy/move files** - via interactive menu
- **File info** - detailed statistics

### 🚀 System Control
- **System Information** - Full OS, CPU, memory details
- **Process Management** - List and kill processes
- **Directory Navigation** - cwd, cd commands
- **Quick Status** - One-glance system overview

### 🔧 Developer Tools
- **NPM Integration** - install, run scripts
- **Git Operations** - status, commit, add
- **Shell Execution** - Run any command

### 🌐 Network Tools
- **Connection Check** - Test internet connectivity
- **Ping** - Ping any host
- **Public IP** - Get your external IP
- **Network Interfaces** - View all adapters

### 🎵 Audio Commands
- **Text-to-Speech** - Speak any text (Windows/macOS/Linux)
- **Voice Listing** - See available voices

---

## 📦 Installation

### From npm (recommended)
```bash
npm install -g agent-steve-cli
```

### From source
```bash
git clone https://github.com/audifyx/SteveCLI.git
cd SteveCLI
npm install
```

### Standalone .exe (Windows)
Download the latest `agent-steve-cli.exe` from the releases page (or build it yourself - see below).

No Node.js required!

---

## 🚀 Usage

### Interactive Mode (Beautiful UI)
```bash
steve
```
or
```bash
node index.js
```

This opens the full-screen interactive menu with:
- Large, centered, colorful UI
- Easy-to-read boxes
- Categorized menus
- Real system information

### Command Line Mode (Scripting)
```bash
# File operations
steve read package.json
steve write output.txt "Hello World"
steve delete temp.txt
steve ls

# System info
steve sysinfo
steve ps
steve kill 1234
steve cwd
steve cd C:\Users

# Network
steve ping google.com
steve myip
steve exec "ipconfig /all"

# Audio
steve speak "Hello, I am Agent Steve"

# Developer tools
steve exec "npm run build"
```

---

## 🔨 Building from Source

### Prerequisites
- Node.js 16+
- npm

### Steps
```bash
cd agent-steve-cli
npm install
npm run build   # Windows: creates .exe in dist/
```

### Using pkg directly
```bash
npx pkg . --out-path dist --targets node16-win-x64
```

The executable will be at: `dist/agent-steve-cli.exe`

---

## 🎨 UI Preview

The interactive mode features:

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║            _    _ _    _    _____           _                ║
║           |  \/  | |  | |  / ____|         | |               ║
║           | \  / | |__| | | (___   ___  ___| |_ ___  _ __    ║
║           | |\/| |  __  |  \___ \ / _ \/ __| __/ _ \| '__|   ║
║           | |  | | |  | |  ____) |  __/\__ \ || (_) | |     ║
║           |_|  |_|_|  |_| |_____/ \___||___/\__\___/|_|     ║
║                                                               ║
║     Advanced Computer Control Interface v3.0                ║
║     Powered by OpenClaw • By Audifyx                        ║
║     2025-03-04 • 1:22 PM                                    ║
╚═══════════════════════════════════════════════════════════════╝
```

Large centered boxes with:
- 📁 File Operations
- 🚀 System Control
- 🔧 Developer Tools
- 🌐 Network Tools
- 🎵 Audio Commands

---

## 📋 Requirements

- **Node.js**: 16+ (for running from source)
- **OS**: Windows, macOS, Linux
- **Permissions**: Standard user (admin/sudo for process kill)

---

## 🐛 Known Issues

- `ps` command only shows first 30 processes on Windows (limit can be increased)
- Text-to-speech requires system TTS engine (Windows SAPI / macOS say / Linux espeak)
- Build with `pkg` may warn about `open` module - harmless, .exe still works

---

## 📄 License

MIT

---

## 🙏 Credits

Built with:
- [chalk](https://github.com/chalk/chalk) - Terminal colors
- [inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive prompts
- [ora](https://github.com/sindresorhus/ora) - Spinners
- [figlet](https://github.com/patorjk/figlet.js) - ASCII banners
- [boxen](https://github.com/sindresorhus/boxen) - Boxes
- [commander](https://github.com/tj/commander.js) - CLI framework

Powered by [OpenClaw](https://openclaw.ai)
