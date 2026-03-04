#!/usr/bin/env node

/**
 * AGENT STEVE CLI v3.0 - BIG EDITION
 * Full computer control with massive, centered, readable UI
 * Powered by OpenClaw
 */

const figlet = require('figlet');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const gradient = require('gradient-string');
const boxen = require('boxen');

// Get terminal dimensions
const TERM_WIDTH = process.stdout.columns || 80;
const TERM_HEIGHT = process.stdout.rows || 24;

// ============================================
// UI HELPERS
// ============================================

function clearScreen() {
  console.log('\x1Bc');
}

function centerText(text, width = TERM_WIDTH) {
  const lines = text.split('\n');
  return lines.map(line => {
    const padding = Math.max(0, Math.floor((width - line.length) / 2));
    return ' '.repeat(padding) + line;
  }).join('\n');
}

function showBanner() {
  clearScreen();
  
  const banner = figlet.textSync('AGENT STEVE', {
    font: 'Standard',
   HorizontalLayout: 'default',
    verticalLayout: 'default'
  });

  const gradientBanner = gradient('cyber', banner);
  const centeredBanner = centerText(gradientBanner);
  
  console.log('\n');
  console.log(centeredBanner);
  console.log('\n');
  
  const lineWidth = Math.min(TERM_WIDTH, 100);
  const line = chalk.cyan('═'.repeat(lineWidth));
  const centeredLine = centerText(line, lineWidth);
  console.log(centeredLine);
  
  const title = chalk.white.bold('      Advanced Computer Control Interface v3.0');
  const subtitle = chalk.gray('      Powered by OpenClaw • By Audifyx');
  const timestamp = chalk.cyan(`      ${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}`);
  
  console.log(centerText(title, lineWidth));
  console.log(centerText(subtitle, lineWidth));
  console.log(centerText(timestamp, lineWidth));
  console.log(centeredLine);
  console.log('\n');
}

function showSpinner(text, duration = 1000) {
  return new Promise(resolve => {
    const spinner = ora(text).start();
    setTimeout(() => {
      spinner.succeed();
      resolve();
    }, duration);
  });
}

function showError(message) {
  const errorBox = boxen(chalk.red.bold(`✗ ${message}`), {
    padding: 2,
    margin: { top: 1, bottom: 1, left: 2, right: 2 },
    borderStyle: 'double',
    borderColor: 'red',
    backgroundColor: '#000000',
    width: Math.min(TERM_WIDTH - 4, 80)
  });
  console.log(centerText(errorBox));
}

function showSuccess(message) {
  const successBox = boxen(chalk.green.bold(`✓ ${message}`), {
    padding: 2,
    margin: { top: 1, bottom: 1, left: 2, right: 2 },
    borderStyle: 'double',
    borderColor: 'green',
    backgroundColor: '#000000',
    width: Math.min(TERM_WIDTH - 4, 80)
  });
  console.log(centerText(successBox));
}

function showInfo(message) {
  const infoBox = boxen(chalk.cyan(message), {
    padding: 2,
    margin: { top: 1, bottom: 1, left: 2, right: 2 },
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#000000',
    width: Math.min(TERM_WIDTH - 4, 80)
  });
  console.log(centerText(infoBox));
}

function showLargeMenu(title, choices, multi = false) {
  clearScreen();
  showBanner();
  
  const menuTitle = boxen(chalk.white.bold(title), {
    padding: { top: 1, bottom: 1, left: 4, right: 4 },
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#000000',
    width: Math.min(TERM_WIDTH - 4, 100)
  });
  
  console.log(centerText(menuTitle));
  console.log('\n');

  const questions = [{
    type: multi ? 'checkbox' : 'list',
    name: 'selection',
    message: chalk.yellow('Choose an option:'),
    choices: choices,
    pageSize: Math.min(20, choices.length)
  }];

  return inquirer.prompt(questions);
}

function showPause() {
  return inquirer.prompt([{
    type: 'input',
    name: 'continue',
    message: chalk.gray('\nPress Enter to return to menu...')
  }]);
}

// ============================================
// FILE OPERATIONS (Same as before but with better UI)
// ============================================

const fileCommands = {
  async read(filepath) {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      return { success: true, content, size: content.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async write(filepath, content) {
    try {
      fs.writeFileSync(filepath, content, 'utf8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async delete(filepath) {
    try {
      fs.unlinkSync(filepath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async list(dir = '.') {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      const result = [];
      for (const item of items) {
        const stats = fs.statSync(path.join(dir, item.name));
        result.push({
          name: item.name,
          type: item.isDirectory() ? 'dir' : 'file',
          size: stats.size,
          modified: stats.mtime
        });
      }
      return { success: true, items: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async copy(src, dest) {
    try {
      fs.copyFileSync(src, dest);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async move(src, dest) {
    try {
      fs.renameSync(src, dest);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async exists(filepath) {
    try {
      const exists = fs.existsSync(filepath);
      return { success: true, exists, stats: exists ? fs.statSync(filepath) : null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

// ============================================
// SYSTEM OPERATIONS
// ============================================

const systemCommands = {
  async info() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const cpus = os.cpus();
      const loadAvg = os.loadavg();

      return {
        success: true,
        data: {
          os: {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            uptime: os.uptime(),
            hostname: os.hostname(),
            type: os.type()
          },
          cpu: {
            cores: cpus.length,
            model: cpus[0]?.model || 'Unknown',
            speed: cpus[0]?.speed || 0,
            load: loadAvg ? loadAvg[0] : 0
          },
          memory: {
            total: totalMem,
            free: freeMem,
            used: totalMem - freeMem,
            usage: ((totalMem - freeMem) / totalMem * 100).toFixed(1)
          }
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async processes() {
    try {
      const result = await new Promise((resolve, reject) => {
        exec('tasklist /fo csv /nh', (err, stdout, stderr) => {
          if (err) return reject(err);
          const lines = stdout.trim().split('\n');
          const processes = [];
          for (const line of lines) {
            if (!line.trim()) continue;
            const parts = line.split('","').map(p => p.replace(/^"|"$/g, '').trim());
            if (parts.length >= 2) {
              processes.push({
                name: parts[0],
                pid: parseInt(parts[1]),
                memory: parseFloat(parts[4].replace(/,/g, '')) || 0
              });
            }
          }
          resolve(processes);
        });
      });
      return { success: true, processes: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async kill(pid) {
    try {
      exec(`taskkill /F /PID ${pid}`, (err) => {
        if (err) throw err;
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async cwd() {
    return {
      success: true,
      cwd: process.cwd()
    };
  },

  async cd(dir) {
    try {
      process.chdir(dir);
      return { success: true, cwd: process.cwd() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

// ============================================
// SHELL EXECUTION
// ============================================

function execCommand(command, callback) {
  const spinner = ora(`Executing: ${command}`).start();
  
  exec(command, { maxbuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      spinner.fail(`Failed: ${error.message}`);
      callback({ success: false, error: error.message, stdout, stderr });
      return;
    }
    if (stderr) {
      spinner.warn('Completed with warnings');
    } else {
      spinner.succeed('Completed');
    }
    callback({ success: true, stdout, stderr });
  });
}

// ============================================
// DEV TOOLS
// ============================================

const devCommands = {
  async npmCmd(args) {
    return new Promise((resolve) => {
      const spinner = ora(`Running npm ${args}`).start();
      exec(`npm ${args}`, { maxbuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          spinner.fail(`npm ${args} failed`);
          resolve({ success: false, error: err.message, stdout, stderr });
        } else {
          spinner.succeed(`npm ${args} completed`);
          resolve({ success: true, stdout, stderr });
        }
      });
    });
  },

  async gitStatus() {
    return new Promise((resolve) => {
      exec('git status --porcelain', (err, stdout) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          const files = stdout.trim().split('\n').filter(l => l);
          resolve({ success: true, files });
        }
      });
    });
  },

  async gitCommit(message) {
    return new Promise((resolve) => {
      exec(`git commit -m "${message}"`, (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, error: err.message, stdout, stderr });
        } else {
          resolve({ success: true, stdout, stderr });
        }
      });
    });
  },

  async gitAdd(files = '.') {
    return new Promise((resolve) => {
      exec(`git add ${files}`, (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  }
};

// ============================================
// NETWORK
// ============================================

const networkCommands = {
  async ping(host = '8.8.8.8') {
    return new Promise((resolve) => {
      const cmd = os.platform() === 'win32' ? `ping -n 4 ${host}` : `ping -c 4 ${host}`;
      exec(cmd, (err, stdout, stderr) => {
        resolve({ success: !err, stdout, stderr });
      });
    });
  },

  async checkConnection() {
    const result = await this.ping();
    const isConnected = result.stdout.includes('TTL=') || result.stdout.includes('time=');
    return { success: true, connected: isConnected, result };
  },

  async getPublicIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return { success: true, ip: data.ip };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

// ============================================
// TTS (Text-to-Speech)
// ============================================

const ttsCommands = {
  async speak(text) {
    if (os.platform() === 'win32') {
      const script = `
        $speak = New-Object -ComObject SAPI.SpVoice;
        $speak.Speak("${text.replace(/"/g, '\\"')}");
      `;
      return new Promise((resolve) => {
        exec(`powershell -Command "${script}"`, (err) => {
          resolve({ success: !err, error: err ? err.message : null });
        });
      });
    } else {
      const sayCmd = os.platform() === 'darwin' ? 'say' : 'espeak';
      return new Promise((resolve) => {
        exec(`${sayCmd} "${text}"`, (err) => {
          resolve({ success: !err, error: err ? err.message : null });
        });
      });
    }
  },

  async voices() {
    if (os.platform() === 'win32') {
      const script = `
        $speak = New-Object -ComObject SAPI.SpVoice;
        $speak.GetVoices() | ForEach-Object { $_.GetDescription() }
      `;
      return new Promise((resolve) => {
        exec(`powershell -Command "${script}"`, (err, stdout, stderr) => {
          if (err) {
            resolve({ success: false, error: err.message });
          } else {
            const voices = stdout.split('\n').filter(v => v.trim());
            resolve({ success: true, voices });
          }
        });
      });
    } else {
      return { success: true, voices: ['default'] };
    }
  }
};

// ============================================
// INTERFACE FUNCTIONS - BIG VERSION
// ============================================

async function showFileMenu() {
  clearScreen();
  showBanner();
  
  const menuChoices = [
    '📂 List directory contents',
    '📄 Read file',
    '✏️  Write/create file',
    '🗑️  Delete file',
    '📋 Copy file',
    '✂️  Move/rename file',
    '🔍 Check file info',
    '🔙 Back to main menu',
    '🚪 Exit'
  ];

  while (true) {
    const { selection } = await showLargeMenu('📁 FILE OPERATIONS', menuChoices);
    const action = Array.isArray(selection) ? selection[0] : selection;

    if (action === '🔙 Back to main menu') return showMainMenu();
    if (action === '🚪 Exit') process.exit(0);

    switch (action) {
      case '📂 List directory contents':
        const { dir } = await inquirer.prompt([{ type: 'input', name: 'dir', message: 'Directory path:', default: '.' }]);
        const listResult = await fileCommands.list(dir);
        if (listResult.success) {
          console.log('');
          const listBox = boxen(chalk.cyan(`Contents of ${path.resolve(dir)}\n\n${listResult.items.map(item => {
            const icon = item.type === 'dir' ? chalk.blue('📁') : chalk.white('📄');
            const size = item.type === 'file' ? chalk.gray(`(${(item.size / 1024).toFixed(1)} KB)`) : '';
            return `  ${icon} ${item.name.padEnd(50)} ${size}`;
          }).join('\n')}\n\nTotal: ${listResult.items.length} items`), {
            padding: 2,
            borderStyle: 'round',
            borderColor: 'green',
            backgroundColor: '#000000',
            width: Math.min(TERM_WIDTH - 4, 120)
          });
          console.log(centerText(listBox));
        } else {
          showError(listResult.error);
        }
        break;

      case '📄 Read file':
        const { filepath } = await inquirer.prompt([{ type: 'input', name: 'filepath', message: 'File path:' }]);
        const readResult = await fileCommands.read(filepath);
        if (readResult.success) {
          const contentBox = boxen(
            chalk.cyan(`Content of ${filepath}\n\n${readResult.content.substring(0, 3000)}${readResult.content.length > 3000 ? chalk.gray('\n... (truncated)') : ''}`),
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'cyan',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          console.log(centerText(contentBox));
        } else {
          showError(readResult.error);
        }
        break;

      case '✏️  Write/create file':
        const { file, content } = await inquirer.prompt([
          { type: 'input', name: 'file', message: 'File path:' },
          { type: 'editor', name: 'content', message: 'Content:' }
        ]);
        const writeResult = await fileCommands.write(file, content);
        if (writeResult.success) {
          showSuccess(`Created/wrote ${file}`);
        } else {
          showError(writeResult.error);
        }
        break;

      case '🗑️  Delete file':
        const { delFile } = await inquirer.prompt([
          { type: 'input', name: 'delFile', message: 'File to delete:' },
          { type: 'confirm', name: 'confirm', message: chalk.red('Are you sure? THIS CANNOT BE UNDONE!') }
        ]);
        if (delFile.confirm) {
          const delResult = await fileCommands.delete(delFile.delFile);
          if (delResult.success) {
            showSuccess(`Deleted ${delFile.delFile}`);
          } else {
            showError(delResult.error);
          }
        }
        break;

      case '📋 Copy file':
        const { src, dest } = await inquirer.prompt([
          { type: 'input', name: 'src', message: 'Source file:' },
          { type: 'input', name: 'dest', message: 'Destination:' }
        ]);
        const copyResult = await fileCommands.copy(src, dest);
        if (copyResult.success) {
          showSuccess(`Copied ${src} to ${dest}`);
        } else {
          showError(copyResult.error);
        }
        break;

      case '✂️  Move/rename file':
        const { from, to } = await inquirer.prompt([
          { type: 'input', name: 'from', message: 'Source file:' },
          { type: 'input', name: 'to', message: 'Destination:' }
        ]);
        const moveResult = await fileCommands.move(from, to);
        if (moveResult.success) {
          showSuccess(`Moved ${from} to ${to}`);
        } else {
          showError(moveResult.error);
        }
        break;

      case '🔍 Check file info':
        const { infoFile } = await inquirer.prompt([{ type: 'input', name: 'infoFile', message: 'File path:' }]);
        const infoResult = await fileCommands.exists(infoFile.infoFile);
        if (infoResult.success && infoResult.exists) {
          const stats = infoResult.stats;
          const infoBox = boxen(
            chalk.cyan(`📊 File Information\n\n`) +
            chalk.white(`  Path:        ${path.resolve(infoFile.infoFile)}\n`) +
            chalk.white(`  Size:        ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)\n`) +
            chalk.white(`  Created:     ${stats.birthtime}\n`) +
            chalk.white(`  Modified:    ${stats.mtime}\n`) +
            chalk.white(`  Accessed:    ${stats.atime}\n`) +
            chalk.white(`  Is Dir:      ${stats.isDirectory()}\n`) +
            chalk.white(`  Is File:     ${stats.isFile()}`),
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'cyan',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          console.log(centerText(infoBox));
        } else {
          showError('File does not exist or error occurred');
        }
        break;
    }

    await showPause();
  }
}

async function showSystemMenu() {
  clearScreen();
  showBanner();

  const menuChoices = [
    '📊 System Information',
    '📋 List Processes',
    '💥 Kill Process',
    '⚡ Quick Status',
    '📁 Current Directory',
    '🔧 Change Directory',
    '🔙 Back to main menu',
    '🚪 Exit'
  ];

  while (true) {
    const { selection } = await showLargeMenu('🚀 SYSTEM CONTROL', menuChoices);
    const action = Array.isArray(selection) ? selection[0] : selection;

    if (action === '🔙 Back to main menu') return showMainMenu();
    if (action === '🚪 Exit') process.exit(0);

    switch (action) {
      case '📊 System Information':
        const infoSpinner = ora('Gathering system info...').start();
        const infoResult = await systemCommands.info();
        if (infoResult.success) {
          const d = infoResult.data;
          const infoBox = boxen(
            chalk.cyan('SYSTEM INFORMATION\n\n') +
            chalk.white(`OS:           ${d.os.platform} ${d.os.release} (${d.os.arch})\n`) +
            chalk.white(`Hostname:     ${d.os.hostname}\n`) +
            chalk.white(`Uptime:       ${Math.floor(d.os.uptime / 3600)} hours\n\n`) +
            chalk.white(`CPU:          ${d.cpu.cores} cores\n`) +
            chalk.white(`CPU Model:    ${d.cpu.model}\n`) +
            chalk.white(`CPU Speed:    ${d.cpu.speed} MHz\n`) +
            chalk.white(`CPU Load:     ${d.cpu.load.toFixed(1)}%\n\n`) +
            chalk.white(`Memory:       ${(d.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(d.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB\n`) +
            chalk.white(`Memory Usage: ${d.memory.usage}%`),
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'cyan',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          infoSpinner.succeed();
          console.log(centerText(infoBox));
        } else {
          infoSpinner.fail();
          showError(infoResult.error);
        }
        break;

      case '📋 List Processes':
        const procSpinner = ora('Fetching processes...').start();
        const procResult = await systemCommands.processes();
        if (procResult.success) {
          procSpinner.succeed();
          const procList = procResult.processes.slice(0, 30).map(p => 
            `  ${chalk.cyan(p.pid.toString().padStart(7))}  ${chalk.white(p.name.padEnd(30))}  ${chalk.yellow((p.memory / 1024 / 1024).toFixed(1).padStart(6))} MB`
          ).join('\n');
          
          const procBox = boxen(
            chalk.cyan(`Running Processes (${procResult.processes.length} total)\n\n`) + procList + 
            (procResult.processes.length > 30 ? chalk.gray(`\n... and ${procResult.processes.length - 30} more`) : ''),
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'yellow',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          console.log(centerText(procBox));
        } else {
          procSpinner.fail();
          showError(procResult.error);
        }
        break;

      case '💥 Kill Process':
        const { pid } = await inquirer.prompt([{ type: 'input', name: 'pid', message: 'Process ID to kill:' }]);
        const killResult = await systemCommands.kill(pid);
        if (killResult.success) {
          showSuccess(`Process ${pid} terminated`);
        } else {
          showError(killResult.error);
        }
        break;

      case '⚡ Quick Status':
        const quickResult = await systemCommands.info();
        if (quickResult.success) {
          const d = quickResult.data;
          const quickBox = boxen(
            chalk.cyan('QUICK STATUS\n\n') +
            chalk.white(`CPU:  ${d.cpu.load.toFixed(1)}% (${d.cpu.cores} cores)\n`) +
            chalk.white(`RAM:  ${(d.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(d.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB\n`) +
            chalk.white(`Host: ${d.os.hostname.padEnd(30)}\n`) +
            chalk.white(`Uptime: ${Math.floor(d.os.uptime / 3600)}h`),
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'green',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          console.log(centerText(quickBox));
        }
        break;

      case '📁 Current Directory':
        const cwdResult = await systemCommands.cwd();
        if (cwdResult.success) {
          const list = await fileCommands.list(cwdResult.cwd);
          if (list.success) {
            const items = list.items.slice(0, 20).map(item => {
              const icon = item.type === 'dir' ? chalk.blue('📁') : chalk.white('📄');
              return `  ${icon} ${item.name}`;
            }).join('\n');
            const cwdBox = boxen(
              chalk.cyan(`Current Directory\n\n${cwdResult.cwd}\n\nContents:\n\n${items}${list.items.length > 20 ? chalk.gray(`\n... and ${list.items.length - 20} more`) : ''}`),
              {
                padding: 2,
                borderStyle: 'round',
                borderColor: 'cyan',
                backgroundColor: '#000000',
                width: Math.min(TERM_WIDTH - 4, 120)
              }
            );
            console.log(centerText(cwdBox));
          }
        }
        break;

      case '🔧 Change Directory':
        const { newDir } = await inquirer.prompt([{ type: 'input', name: 'newDir', message: 'New directory:' }]);
        const cdResult = await systemCommands.cd(newDir);
        if (cdResult.success) {
          showSuccess(`Changed to ${cdResult.cwd}`);
        } else {
          showError(cdResult.error);
        }
        break;
    }

    await showPause();
  }
}

async function showDevMenu() {
  clearScreen();
  showBanner();

  const menuChoices = [
    '📦 NPM Install',
    '📦 NPM Run Script',
    '🔨 Git Status',
    '💾 Git Commit',
    '📤 Git Add All',
    '🔙 Back to main menu',
    '🚪 Exit'
  ];

  while (true) {
    const { selection } = await showLargeMenu('🔧 DEVELOPER TOOLS', menuChoices);
    const action = Array.isArray(selection) ? selection[0] : selection;

    if (action === '🔙 Back to main menu') return showMainMenu();
    if (action === '🚪 Exit') process.exit(0);

    switch (action) {
      case '📦 NPM Install':
        const installResult = await devCommands.npmCmd('install');
        if (!installResult.success) showError(installResult.error);
        break;

      case '📦 NPM Run Script':
        const { script } = await inquirer.prompt([{ type: 'input', name: 'script', message: 'Script name (e.g., build, start):' }]);
        const runResult = await devCommands.npmCmd(`run ${script}`);
        if (!runResult.success) showError(runResult.error);
        break;

      case '🔨 Git Status':
        const statusResult = await devCommands.gitStatus();
        if (statusResult.success) {
          if (statusResult.files.length === 0) {
            showSuccess('Working tree clean');
          } else {
            const gitList = statusResult.files.slice(0, 20).map(f => {
              const status = f.substring(0, 2);
              const file = f.substring(3);
              const color = status === 'M ' ? chalk.yellow : status === 'A ' ? chalk.green : chalk.red;
              return `  ${color(status.padEnd(5))} ${file}`;
            }).join('\n');
            
            const gitBox = boxen(
              chalk.cyan('Git Status\n\n') + gitList +
              (statusResult.files.length > 20 ? chalk.gray(`\n... and ${statusResult.files.length - 20} more`) : ''),
              {
                padding: 2,
                borderStyle: 'round',
                borderColor: 'yellow',
                backgroundColor: '#000000',
                width: Math.min(TERM_WIDTH - 4, 120)
              }
            );
            console.log(centerText(gitBox));
          }
        } else {
          showError(statusResult.error);
        }
        break;

      case '💾 Git Commit':
        const { msg } = await inquirer.prompt([{ type: 'input', name: 'msg', message: 'Commit message:' }]);
        const commitResult = await devCommands.gitCommit(msg);
        if (commitResult.success) {
          showSuccess('Changes committed');
        } else {
          showError(commitResult.error);
        }
        break;

      case '📤 Git Add All':
        const addResult = await devCommands.gitAdd('.');
        if (addResult.success) {
          showSuccess('All changes staged');
        } else {
          showError(addResult.error);
        }
        break;
    }

    await showPause();
  }
}

async function showAudioMenu() {
  clearScreen();
  showBanner();

  while (true) {
    const menuChoices = [
      '🗣️  Speak Text',
      '🔊 List Voices',
      '🔙 Back to main menu',
      '🚪 Exit'
    ];

    const { selection } = await showLargeMenu('🎵 AUDIO COMMANDS', menuChoices);
    const action = Array.isArray(selection) ? selection[0] : selection;

    if (action === '🔙 Back to main menu') return showMainMenu();
    if (action === '🚪 Exit') process.exit(0);

    if (action === '🗣️  Speak Text') {
      const { text } = await inquirer.prompt([
        { type: 'input', name: 'text', message: 'Text to speak:' }
      ]);
      const speakSpinner = ora('Speaking...').start();
      const speakResult = await ttsCommands.speak(text.text);
      speakSpinner.succeed('Done');
      if (!speakResult.success) {
        showError(speakResult.error || 'Text-to-speech not available on this system');
      }
    }

    if (action === '🔊 List Voices') {
      const voices = await ttsCommands.voices();
      if (voices.success) {
        const voiceBox = boxen(
          chalk.cyan('Available Voices:\n\n') + voices.voices.map(v => `  - ${v}`).join('\n'),
          {
            padding: 2,
            borderStyle: 'round',
            borderColor: 'magenta',
            backgroundColor: '#000000',
            width: Math.min(TERM_WIDTH - 4, 120)
          }
        );
        console.log(centerText(voiceBox));
      } else {
        showError(voices.error);
      }
    }

    await showPause();
  }
}

async function showNetworkMenu() {
  clearScreen();
  showBanner();

  const menuChoices = [
    '🌍 Check Internet Connection',
    '📡 Ping Host',
    '🌐 Get Public IP',
    '🔍 Network Interfaces',
    '🔙 Back to main menu',
    '🚪 Exit'
  ];

  while (true) {
    const { selection } = await showLargeMenu('🌐 NETWORK TOOLS', menuChoices);
    const action = Array.isArray(selection) ? selection[0] : selection;

    if (action === '🔙 Back to main menu') return showMainMenu();
    if (action === '🚪 Exit') process.exit(0);

    switch (action) {
      case '🌍 Check Internet Connection':
        const connSpinner = ora('Checking connection...').start();
        const connResult = await networkCommands.checkConnection();
        if (connResult.connected) {
          connSpinner.succeed();
          showSuccess('Internet is working ✓');
        } else {
          connSpinner.fail();
          showError('No internet connection');
        }
        break;

      case '📡 Ping Host':
        const { host } = await inquirer.prompt([{ type: 'input', name: 'host', message: 'Host to ping:', default: '8.8.8.8' }]);
        const pingSpinner = ora(`Pinging ${host.host}...`).start();
        const pingResult = await networkCommands.ping(host.host);
        pingSpinner.succeed();
        const pingBox = boxen(
          chalk.cyan('Ping Result\n\n') + pingResult.stdout,
          {
            padding: 2,
            borderStyle: 'round',
            borderColor: 'green',
            backgroundColor: '#000000',
            width: Math.min(TERM_WIDTH - 4, 120)
          }
        );
        console.log(centerText(pingBox));
        break;

      case '🌐 Get Public IP':
        const ipSpinner = ora('Fetching public IP...').start();
        const ipResult = await networkCommands.getPublicIP();
        if (ipResult.success) {
          ipSpinner.succeed();
          showSuccess(`Your public IP: ${chalk.green.bold(ipResult.ip)}`);
        } else {
          ipSpinner.fail();
          showError(ipResult.error);
        }
        break;

      case '🔍 Network Interfaces':
        const ifaceSpinner = ora('Loading interfaces...').start();
        try {
          const ifaces = os.networkInterfaces();
          ifaceSpinner.succeed();
          let ifaceText = '';
          Object.keys(ifaces).forEach(name => {
            ifaceText += chalk.white.bold(`\n  ${name}\n`);
            ifaces[name].forEach(iface => {
              const addr = iface.address;
              const family = iface.family;
              ifaceText += `    ${family}: ${addr} (${iface.internal ? 'internal' : 'external'})\n`;
            });
          });
          const ifaceBox = boxen(
            chalk.cyan('Network Interfaces:') + ifaceText,
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'green',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          console.log(centerText(ifaceBox));
        } catch (err) {
          ifaceSpinner.fail();
          showError(err.message);
        }
        break;
    }

    await showPause();
  }
}

async function showMainMenu() {
  clearScreen();
  showBanner();

  const menuChoices = [
    chalk.cyan('🚀 System Control'),
    chalk.green('📁 File Operations'),
    chalk.yellow('🔧 Developer Tools'),
    chalk.magenta('🎵 Audio Commands'),
    chalk.green('🌐 Network Tools'),
    chalk.white('🚪 Exit')
  ];

  const { category } = await showLargeMenu('MAIN MENU', menuChoices, false);

  const selected = Array.isArray(category) ? category[0] : category;

  switch (selected) {
    case chalk.cyan('🚀 System Control'):
      await showSystemMenu();
      break;
    case chalk.green('📁 File Operations'):
      await showFileMenu();
      break;
    case chalk.yellow('🔧 Developer Tools'):
      await showDevMenu();
      break;
    case chalk.magenta('🎵 Audio Commands'):
      await showAudioMenu();
      break;
    case chalk.green('🌐 Network Tools'):
      await showNetworkMenu();
      break;
    default:
      console.log(chalk.yellow('\n\n👋 Goodbye! Agent Steve signing off...'));
      process.exit(0);
  }
}

// ============================================
// COMMAND LINE ARGUMENTS
// ============================================

const { Command } = require('commander');
const program = new Command();

program
  .name('steve')
  .description('Agent Steve CLI - Full computer control with beautiful UI')
  .version('3.0.1');

// File commands
program.command('read <file>').action(async (file) => {
  const result = await fileCommands.read(file);
  if (result.success) {
    console.log(result.content);
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('write <file> <content>').action(async (file, content) => {
  const result = await fileCommands.write(file, content);
  if (result.success) {
    console.log(chalk.green(`✓ Wrote to ${file}`));
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('delete <file>').action(async (file) => {
  const result = await fileCommands.delete(file);
  if (result.success) {
    console.log(chalk.green(`✓ Deleted ${file}`));
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('ls [dir]').action(async (dir = '.') => {
  const result = await fileCommands.list(dir);
  if (result.success) {
    result.items.forEach(item => {
      const icon = item.type === 'dir' ? '📁' : '📄';
      console.log(`${icon} ${item.name}`);
    });
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

// System commands
program.command('sysinfo').action(async () => {
  const result = await systemCommands.info();
  if (result.success) {
    const d = result.data;
    console.log(chalk.cyan('\n=== System Information ===\n'));
    console.log(`OS: ${d.os.platform} ${d.os.release} (${d.os.arch})`);
    console.log(`Hostname: ${d.os.hostname}`);
    console.log(`Uptime: ${Math.floor(d.os.uptime / 3600)} hours`);
    console.log(`CPU: ${d.cpu.cores} cores, ${d.cpu.load.toFixed(1)}%`);
    console.log(`Memory: ${(d.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(d.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB (${d.memory.usage}%)`);
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('ps').action(async () => {
  const result = await systemCommands.processes();
  if (result.success) {
    result.processes.slice(0, 30).forEach(p => {
      console.log(`${p.pid}  ${p.name.padEnd(30)}  ${(p.memory / 1024 / 1024).toFixed(1)}MB`);
    });
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('kill <pid>').action(async (pid) => {
  const result = await systemCommands.kill(pid);
  if (result.success) {
    console.log(chalk.green(`✓ Killed process ${pid}`));
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

// Shell execution
program.command('exec <command>').action(async (command) => {
  await new Promise((resolve) => {
    execCommand(command, (result) => {
      if (result.success) {
        if (result.stdout) console.log(result.stdout);
        resolve();
      } else {
        console.error(chalk.red(`✗ Error: ${result.error}`));
        if (result.stderr) console.error(chalk.yellow(result.stderr));
        process.exit(1);
      }
    });
  });
});

// Audio commands
program.command('speak <text>').action(async (text) => {
  const result = await ttsCommands.speak(text);
  if (!result.success) {
    console.error(chalk.red(`✗ Error: ${result.error || 'TTS not available'}`));
    process.exit(1);
  }
});

// Network commands
program.command('ping [host]').action(async (host = '8.8.8.8') => {
  const result = await networkCommands.ping(host);
  if (result.success) {
    console.log(result.stdout);
  } else {
    console.error(chalk.red(`✗ Ping failed: ${result.error}`));
    process.exit(1);
  }
});

program.command('myip').action(async () => {
  const result = await networkCommands.getPublicIP();
  if (result.success) {
    console.log(chalk.green(result.ip));
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

// Utility
program.command('cwd').action(async () => {
  const result = await systemCommands.cwd();
  if (result.success) {
    console.log(result.cwd);
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('cd <dir>').action(async (dir) => {
  const result = await systemCommands.cd(dir);
  if (result.success) {
    console.log(chalk.green(`✓ Changed to ${result.cwd}`));
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

// Parse arguments
if (process.argv.length > 2) {
  program.parse();
} else {
  // Interactive mode - no arguments
  showMainMenu();
}
