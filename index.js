#!/usr/bin/env node

/**
 * AGENT STEVE CLI v3.0
 * Full computer control assistant with beautiful animated UI
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
const { open } = require('open');

// ============================================
// UI HELPERS
// ============================================

function clearScreen() {
  console.log('\x1Bc');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showBanner() {
  const banner = figlet.textSync('AGENT STEVE', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  const gradientBanner = gradient('cyber', banner);
  console.log(gradientBanner);

  const line = chalk.cyan('▉'.repeat(60));
  console.log(line);
  console.log(chalk.white.bold('      Advanced Computer Control Interface v3.0'));
  console.log(chalk.gray('      Powered by OpenClaw • By Audifyx'));
  console.log(chalk.cyan(`      ${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}`));
  console.log(line);
  console.log('');
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
  console.log(boxen(chalk.red(`✗ ${message}`), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'red',
    backgroundColor: '#000000'
  }));
}

function showSuccess(message) {
  console.log(boxen(chalk.green(`✓ ${message}`), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'green',
    backgroundColor: '#000000'
  }));
}

function showInfo(message) {
  console.log(boxen(chalk.cyan(message), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#000000'
  }));
}

// ============================================
// FILE OPERATIONS
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
          },
          network: os.networkInterfaces()
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
      exec(`taskkill /F /PID ${pid}`, (err, stdout, stderr) => {
        if (err) throw err;
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async env() {
    return {
      success: true,
      env: process.env
    };
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
  },

  async lint(dir = '.') {
    const result = await this.npmCmd(`run lint --if-present`);
    return result;
  },

  async test(dir = '.') {
    const result = await this.npmCmd(`test -- --silent`);
    return result;
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
      // Windows SAPI
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
      // macOS/Linux - say/espeak
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
// INTERFACE FUNCTIONS
// ============================================

async function showFileMenu() {
  clearScreen();
  console.log(boxen(chalk.green.bold('📁 File Operations'), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'green',
    backgroundColor: '#000000'
  }));
  console.log('');

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select operation:',
      choices: [
        '📂 List directory contents',
        '📄 Read file',
        '✏️  Write/create file',
        '🗑️  Delete file',
        '📋 Copy file',
        '✂️  Move/rename file',
        '🔍 Check file info',
        '🔙 Back to main menu',
        '🚪 Exit'
      ]
    }
  ]);

  if (action === '🔙 Back to main menu') return showMainMenu();
  if (action === '🚪 Exit') process.exit(0);

  switch (action) {
    case '📂 List directory contents':
      const { dir } = await inquirer.prompt([{ type: 'input', name: 'dir', message: 'Directory path:', default: '.' }]);
      const listResult = await fileCommands.list(dir);
      if (listResult.success) {
        console.log(chalk.cyan(`\nContents of ${path.resolve(dir)}:\n`));
        listResult.items.forEach(item => {
          const icon = item.type === 'dir' ? '📁' : '📄';
          const size = item.type === 'file' ? chalk.gray(`(${(item.size / 1024).toFixed(1)} KB)`) : '';
          console.log(`  ${icon} ${item.name}  ${size}`);
        });
        console.log(`\nTotal: ${listResult.items.length} items`);
      } else {
        showError(listResult.error);
      }
      break;

    case '📄 Read file':
      const { filepath } = await inquirer.prompt([{ type: 'input', name: 'filepath', message: 'File path:' }]);
      const readResult = await fileCommands.read(filepath);
      if (readResult.success) {
        console.log(chalk.cyan(`\n--- Content of ${filepath} (${readResult.content.length} bytes) ---\n`));
        console.log(readResult.content.substring(0, 2000));
        if (readResult.content.length > 2000) console.log(chalk.gray('\n... (truncated, showing first 2000 chars)'));
        console.log(chalk.cyan('\n--- End ---\n'));
      } else {
        showError(readResult.error);
      }
      break;

    case '✏️  Write/create file':
      const { file, content } = await inquirer.prompt([
        { type: 'input', name: 'file', message: 'File path:' },
        { type: 'editor', name: 'content', message: 'Content (Ctrl+X to save, then Enter)' }
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
        { type: 'confirm', name: 'confirm', message: 'Are you sure?' }
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
        console.log(chalk.cyan(`\n📊 File Information:\n`));
        console.log(`  Path: ${path.resolve(infoFile.infoFile)}`);
        console.log(`  Size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
        console.log(`  Created: ${stats.birthtime}`);
        console.log(`  Modified: ${stats.mtime}`);
        console.log(`  Accessed: ${stats.atime}`);
        console.log(`  Is Directory: ${stats.isDirectory()}`);
        console.log(`  Is File: ${stats.isFile()}`);
      } else {
        showError('File does not exist or error occurred');
      }
      break;
  }

  setTimeout(() => {
    inquirer.prompt([{ type: 'input', name: 'cont', message: '\nPress Enter to continue...' }]).then(() => showFileMenu());
  }, 500);
}

async function showSystemMenu() {
  clearScreen();
  console.log(boxen(chalk.cyan.bold('🚀 System Control'), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#000000'
  }));
  console.log('');

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select operation:',
      choices: [
        '📊 System Information',
        '📋 List Processes',
        '💥 Kill Process',
        '⚡ Quick Status',
        '📁 Current Directory',
        '🔧 Change Directory',
        '🔙 Back to main menu',
        '🚪 Exit'
      ]
    }
  ]);

  if (action === '🔙 Back to main menu') return showMainMenu();
  if (action === '🚪 Exit') process.exit(0);

  switch (action) {
    case '📊 System Information':
      const infoSpinner = ora('Gathering system info...').start();
      const infoResult = await systemCommands.info();
      if (infoResult.success) {
        const d = infoResult.data;
        console.log(chalk.cyan('\n=== SYSTEM INFORMATION ===\n'));
        console.log(chalk.white.bold('OS:'), `${d.os.platform} ${d.os.release} (${d.os.arch})`);
        console.log(chalk.white.bold('Hostname:'), d.os.hostname);
        console.log(chalk.white.bold('Uptime:'), `${Math.floor(d.os.uptime / 3600)} hours`);
        console.log('');
        console.log(chalk.white.bold('CPU:'), `${d.cpu.cores} cores, ${d.cpu.load.toFixed(1)}% load`);
        console.log(chalk.white.bold('Memory:'), `${(d.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(d.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB (${d.memory.usage}%)`);
      } else {
        showError(infoResult.error);
      }
      break;

    case '📋 List Processes':
      const procSpinner = ora('Fetching processes...').start();
      const procResult = await systemCommands.processes();
      if (procResult.success) {
        console.log(chalk.cyan(`\n=== Running Processes (${procResult.processes.length} total) ===\n`));
        procResult.processes.slice(0, 20).forEach(p => {
          const mem = (p.memory / 1024 / 1024).toFixed(1);
          console.log(`  ${p.pid.toString().padStart(7)}  ${p.name.padEnd(30)}  ${mem.padStart(6)} MB`);
        });
        if (procResult.processes.length > 20) {
          console.log(chalk.gray(`\n... and ${procResult.processes.length - 20} more`));
        }
        procSpinner.succeed('Process list loaded');
      } else {
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
        console.log(chalk.cyan('\n=== QUICK STATUS ===\n'));
        console.log(`CPU:  ${d.cpu.load.toFixed(1)}% (${d.cpu.cores} cores)`);
        console.log(`RAM:  ${(d.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(d.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB`);
        console.log(`Host: ${d.os.hostname}`);
        console.log(`Uptime: ${Math.floor(d.os.uptime / 3600)}h`);
      }
      break;

    case '📁 Current Directory':
      const cwdResult = await systemCommands.cwd();
      if (cwdResult.success) {
        console.log(chalk.cyan(`\nCurrent directory: ${cwdResult.cwd}\n`));
        const list = await fileCommands.list(cwdResult.cwd);
        if (list.success) {
          list.items.forEach(item => {
            const icon = item.type === 'dir' ? '📁' : '📄';
            console.log(`  ${icon} ${item.name}`);
          });
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

  setTimeout(() => {
    inquirer.prompt([{ type: 'input', name: 'cont', message: '\nPress Enter to continue...' }]).then(() => showSystemMenu());
  }, 500);
}

async function showDevMenu() {
  clearScreen();
  console.log(boxen(chalk.yellow.bold('🔧 Developer Tools'), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'yellow',
    backgroundColor: '#000000'
  }));
  console.log('');

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select tool:',
      choices: [
        '📦 NPM Install',
        '📦 NPM Run Script',
        '🔨 Git Status',
        '💾 Git Commit',
        '📤 Git Add All',
        '🧪 Run Tests',
        '📏 Lint Code',
        '🔍 Search in Files',
        '🔙 Back to main menu',
        '🚪 Exit'
      ]
    }
  ]);

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
        console.log(chalk.cyan('\n=== Git Status ===\n'));
        if (statusResult.files.length === 0) {
          console.log(chalk.green('✓ Working tree clean'));
        } else {
          statusResult.files.forEach(f => {
            const status = f.substring(0, 2);
            const file = f.substring(3);
            const color = status === 'M ' ? chalk.yellow : status === 'A ' ? chalk.green : chalk.red;
            console.log(`  ${color(status)} ${file}`);
          });
        }
      } else {
        showError(statusResult.error);
      }
      break;

    case '💾 Git Commit':
      const { msg } = await inquirer.prompt([{ type: 'input', name: 'msg', message: 'Commit message:' }]);
      const commitResult = await devCommands.gitCommit(msg);
      if (commitResult.success) {
        console.log(chalk.green('\n✓ Committed'));
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

    case '🧪 Run Tests':
      const testSpinner = ora('Running tests...').start();
      const testResult = await devCommands.test();
      testSpinner.succeed('Tests completed');
      if (testResult.stdout) console.log(testResult.stdout);
      break;

    case '📏 Lint Code':
      const lintSpinner = ora('Linting...').start();
      const lintResult = await devCommands.lint();
      lintSpinner.succeed('Lint completed');
      if (lintResult.stdout) console.log(lintResult.stdout);
      break;

    case '🔍 Search in Files':
      const { search } = await inquirer.prompt([{ type: 'input', name: 'search', message: 'Search pattern (regex):' }]);
      console.log(chalk.yellow('\nSearch not implemented yet - coming in v3.1!'));
      break;
  }

  setTimeout(() => {
    inquirer.prompt([{ type: 'input', name: 'cont', message: '\nPress Enter to continue...' }]).then(() => showDevMenu());
  }, 500);
}

async function showAudioMenu() {
  clearScreen();
  console.log(boxen(chalk.magenta.bold('🎵 Audio Commands'), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'magenta',
    backgroundColor: '#000000'
  }));
  console.log('');

  try {
    const voicesResult = await ttsCommands.voices();
    if (voicesResult.success && voicesResult.voices.length > 0) {
      console.log(chalk.cyan('Available voices:\n'));
      voicesResult.voices.forEach((v, i) => console.log(`  ${i + 1}. ${v}`));
    } else {
      console.log(chalk.gray('No additional voices found. Using default.'));
    }
  } catch (e) {
    // TTS might not be available
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Audio options:',
      choices: [
        '🗣️  Speak Text',
        '🔊 List Voices',
        '🔙 Back to main menu',
        '🚪 Exit'
      ]
    }
  ]);

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
      console.log(chalk.cyan('\nAvailable voices:'));
      voices.voices.forEach(v => console.log(`  - ${v}`));
    } else {
      showError(voices.error);
    }
  }

  setTimeout(() => {
    inquirer.prompt([{ type: 'input', name: 'cont', message: '\nPress Enter to continue...' }]).then(() => showAudioMenu());
  }, 500);
}

async function showNetworkMenu() {
  clearScreen();
  console.log(boxen(chalk.green.bold('🌐 Network Tools'), {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'green',
    backgroundColor: '#000000'
  }));
  console.log('');

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Network operations:',
      choices: [
        '🌍 Check Internet Connection',
        '📡 Ping Host',
        '🌐 Get Public IP',
        '🔍 Network Interfaces',
        '🔙 Back to main menu',
        '🚪 Exit'
      ]
    }
  ]);

  if (action === '🔙 Back to main menu') return showMainMenu();
  if (action === '🚪 Exit') process.exit(0);

  switch (action) {
    case '🌍 Check Internet Connection':
      const connSpinner = ora('Checking connection...').start();
      const connResult = await networkCommands.checkConnection();
      if (connResult.connected) {
        connSpinner.succeed('Internet is working');
      } else {
        connSpinner.fail('No internet connection');
      }
      break;

    case '📡 Ping Host':
      const { host } = await inquirer.prompt([{ type: 'input', name: 'host', message: 'Host to ping:', default: '8.8.8.8' }]);
      const pingSpinner = ora(`Pinging ${host.host}...`).start();
      const pingResult = await networkCommands.ping(host.host);
      pingSpinner.succeed('Ping complete');
      console.log(chalk.cyan('\nPing output:\n'));
      console.log(pingResult.stdout);
      break;

    case '🌐 Get Public IP':
      const ipSpinner = ora('Fetching public IP...').start();
      const ipResult = await networkCommands.getPublicIP();
      if (ipResult.success) {
        ipSpinner.succeed(`Your IP: ${chalk.green(ipResult.ip)}`);
      } else {
        ipSpinner.fail('Could not fetch IP');
      }
      break;

    case '🔍 Network Interfaces':
      const ifaceSpinner = ora('Loading interfaces...').start();
      try {
        const ifaces = os.networkInterfaces();
        ifaceSpinner.succeed('Network interfaces');
        console.log(chalk.cyan('\nNetwork Interfaces:\n'));
        Object.keys(ifaces).forEach(name => {
          console.log(chalk.white.bold(name));
          ifaces[name].forEach(iface => {
            const addr = iface.address;
            const family = iface.family;
            console.log(`  ${family}: ${addr} (${iface.internal ? 'internal' : 'external'})`);
          });
        });
      } catch (err) {
        showError(err.message);
      }
      break;
  }

  setTimeout(() => {
    inquirer.prompt([{ type: 'input', name: 'cont', message: '\nPress Enter to continue...' }]).then(() => showNetworkMenu());
  }, 500);
}

async function showMainMenu() {
  clearScreen();
  showBanner();

  const menuBox = boxen(
    chalk.white.bold('Select a category:'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#000000'
    }
  );
  console.log(menuBox);

  const { category } = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: chalk.yellow('Choose a category:'),
      choices: [
        chalk.cyan('🚀 System Control'),
        chalk.green('📁 File Operations'),
        chalk.yellow('🔧 Developer Tools'),
        chalk.magenta('🎵 Audio Commands'),
        chalk.green('🌐 Network'),
        chalk.gray('⚙️ Settings'),
        chalk.white('🚪 Exit')
      ]
    }
  ]);

  switch (category) {
    case '🚀 System Control':
      await showSystemMenu();
      break;
    case '📁 File Operations':
      await showFileMenu();
      break;
    case '🔧 Developer Tools':
      await showDevMenu();
      break;
    case '🎵 Audio Commands':
      await showAudioMenu();
      break;
    case '🌐 Network':
      await showNetworkMenu();
      break;
    case '⚙️ Settings':
      console.log(chalk.yellow('\nSettings menu coming in v3.1!'));
      setTimeout(() => showMainMenu(), 2000);
      break;
    default:
      console.log(chalk.yellow('\n👋 Goodbye! Agent Steve signing off...'));
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
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('write <file> <content>').action(async (file, content) => {
  const result = await fileCommands.write(file, content);
  if (result.success) {
    console.log(chalk.green(`✓ Wrote to ${file}`));
  } else {
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('delete <file>').action(async (file) => {
  const result = await fileCommands.delete(file);
  if (result.success) {
    console.log(chalk.green(`✓ Deleted ${file}`));
  } else {
    console.error(chalk.red(`Error: ${result.error}`));
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
    console.error(chalk.red(`Error: ${result.error}`));
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
    console.error(chalk.red(`Error: ${result.error}`));
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
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('kill <pid>').action(async (pid) => {
  const result = await systemCommands.kill(pid);
  if (result.success) {
    console.log(chalk.green(`✓ Killed process ${pid}`));
  } else {
    console.error(chalk.red(`Error: ${result.error}`));
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
        console.error(chalk.red(`Error: ${result.error}`));
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
    console.error(chalk.red(`Error: ${result.error || 'TTS not available'}`));
    process.exit(1);
  }
});

// Network commands
program.command('ping [host]').action(async (host = '8.8.8.8') => {
  const result = await networkCommands.ping(host);
  if (result.success) {
    console.log(result.stdout);
  } else {
    console.error(chalk.red(`Ping failed: ${result.error}`));
    process.exit(1);
  }
});

program.command('myip').action(async () => {
  const result = await networkCommands.getPublicIP();
  if (result.success) {
    console.log(chalk.green(result.ip));
  } else {
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }
});

// Utility
program.command('cwd').action(async () => {
  const result = await systemCommands.cwd();
  if (result.success) {
    console.log(result.cwd);
  } else {
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('cd <dir>').action(async (dir) => {
  const result = await systemCommands.cd(dir);
  if (result.success) {
    console.log(chalk.green(`Changed to ${result.cwd}`));
  } else {
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }
});

// Parse arguments
if (process.argv.length > 2) {
  program.parse();
} else {
  // Interactive mode
  interactiveMode = true;
  showMainMenu();
}

module.exports = {
  fileCommands,
  systemCommands,
  devCommands,
  networkCommands,
  ttsCommands
};