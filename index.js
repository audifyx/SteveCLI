#!/usr/bin/env node

/**
 * AGENT STEVE CLI v3.1
 * Full computer control with massive, centered, readable UI
 * Includes Twitter/X integration
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
const boxen = require('boxen');
require('dotenv').config();
const twitterClient = require('./twitterClient');

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
  if (typeof text !== 'string') {
    text = String(text);
  }
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
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  const coloredBanner = chalk.cyan(banner);
  const centeredBanner = centerText(coloredBanner);
  
  console.log('\n');
  console.log(centeredBanner);
  console.log('\n');
  
  const lineWidth = Math.min(TERM_WIDTH, 100);
  const line = chalk.cyan('═'.repeat(lineWidth));
  const centeredLine = centerText(line, lineWidth);
  console.log(centeredLine);
  
  const title = chalk.white.bold('      Advanced Computer Control Interface v3.1');
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
// TWITTER/X COMMANDS
// ============================================

const twitterCommands = {
  async tweet(text) {
    const result = await twitterClient.tweet(text);
    return result;
  },

  async timeline(count = 10) {
    const result = await twitterClient.timeline(count);
    return result;
  },

  async userTimeline(username, count = 10) {
    const result = await twitterClient.userTimeline(username, count);
    return result;
  },

  async search(query, count = 10) {
    const result = await twitterClient.search(query, count);
    return result;
  },

  async getUser(username) {
    const result = await twitterClient.getUser(username);
    return result;
  },

  async checkConfig() {
    const appKey = process.env.TWITTER_APP_KEY || process.env.CONSUMER_KEY;
    const appSecret = process.env.TWITTER_APP_SECRET || process.env.CONSUMER_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    const configured = !!(appKey && appSecret && accessToken && accessSecret);
    
    if (configured) {
      try {
        const client = await twitterClient.init();
        if (client) {
          return { success: true, configured: true, message: 'Twitter API configured and connected' };
        }
      } catch (e) {
        return { success: false, configured: true, message: 'Credentials set but connection failed' };
      }
    }
    
    return { 
      success: false, 
      configured: false, 
      message: 'Twitter not configured. Set env vars: TWITTER_APP_KEY, TWITTER_APP_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET' 
    };
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
  // ... (existing file menu code unchanged)
}

async function showSystemMenu() {
  // ... (existing system menu code unchanged)
}

async function showDevMenu() {
  // ... (existing dev menu code unchanged)
}

async function showTwitterMenu() {
  clearScreen();
  showBanner();

  const configCheck = await twitterCommands.checkConfig();
  if (!configCheck.configured) {
    showError('Twitter/X not configured');
    console.log(chalk.gray('\nTo configure, set these environment variables:'));
    console.log(chalk.white('  TWITTER_APP_KEY=your_app_key'));
    console.log(chalk.white('  TWITTER_APP_SECRET=your_app_secret'));
    console.log(chalk.white('  TWITTER_ACCESS_TOKEN=your_access_token'));
    console.log(chalk.white('  TWITTER_ACCESS_SECRET=your_access_secret'));
    console.log(chalk.gray('\nOr create a .env file in the project directory with those values.'));
    await showPause();
    return showMainMenu();
  }

  while (true) {
    const menuChoices = [
      '🐦 Tweet',
      '📰 Your Timeline',
      '👤 User Timeline',
      '🔍 Search Twitter',
      '👥 Get User Info',
      '🔙 Back to main menu',
      '🚪 Exit'
    ];

    const { selection } = await showLargeMenu('🐦 TWITTER / X', menuChoices);
    const action = Array.isArray(selection) ? selection[0] : selection;

    if (action === '🔙 Back to main menu') return showMainMenu();
    if (action === '🚪 Exit') process.exit(0);

    switch (action) {
      case '🐦 Tweet':
        const { tweetText } = await inquirer.prompt([
          { type: 'input', name: 'tweetText', message: 'What would you like to tweet?' }
        ]);
        const tweetSpinner = ora('Posting tweet...').start();
        const tweetResult = await twitterCommands.tweet(tweetText.tweetText);
        if (tweetResult.success) {
          tweetSpinner.succeed('Tweet posted!');
          showSuccess(`Tweet posted! ID: ${tweetResult.tweet.data.id}`);
        } else {
          tweetSpinner.fail('Failed to post tweet');
          showError(tweetResult.error);
        }
        break;

      case '📰 Your Timeline':
        const { count } = await inquirer.prompt([
          { type: 'input', name: 'count', message: 'Number of tweets (max 100):', default: '10' }
        ]);
        const timelineSpinner = ora('Fetching timeline...').start();
        const timelineResult = await twitterCommands.timeline(parseInt(count.count) || 10);
        if (timelineResult.success) {
          timelineSpinner.succeed();
          const timelineList = timelineResult.tweets.slice(0, 10).map(t => 
            `  ${chalk.cyan(t.id)} - ${chalk.white(t.text.substring(0, 80))}${t.text.length > 80 ? '...' : ''}`
          ).join('\n');
          const timelineBox = boxen(
            chalk.cyan(`Home Timeline (${timelineResult.tweets.length} tweets)\n\n`) + timelineList,
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'cyan',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          console.log(centerText(timelineBox));
        } else {
          timelineSpinner.fail();
          showError(timelineResult.error);
        }
        break;

      case '👤 User Timeline':
        const { username, userCount } = await inquirer.prompt([
          { type: 'input', name: 'username', message: 'Username (without @):' },
          { type: 'input', name: 'userCount', message: 'Number of tweets:', default: '10' }
        ]);
        const userTimelineSpinner = ora(`Fetching @${username.username}'s tweets...`).start();
        const userTimelineResult = await twitterCommands.userTimeline(username.username, parseInt(userCount.userCount) || 10);
        if (userTimelineResult.success) {
          userTimelineSpinner.succeed();
          const userTweets = userTimelineResult.tweets.slice(0, 10).map(t => 
            `  ${chalk.cyan(t.id)} - ${chalk.white(t.text.substring(0, 80))}${t.text.length > 80 ? '...' : ''}`
          ).join('\n');
          const userBox = boxen(
            chalk.cyan(`@${username.username} - ${userTimelineResult.user?.name || 'User'}\n\n`) + userTweets,
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'cyan',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          console.log(centerText(userBox));
        } else {
          userTimelineSpinner.fail();
          showError(userTimelineResult.error);
        }
        break;

      case '🔍 Search Twitter':
        const { query, searchCount } = await inquirer.prompt([
          { type: 'input', name: 'query', message: 'Search query:' },
          { type: 'input', name: 'searchCount', message: 'Number of results:', default: '10' }
        ]);
        const searchSpinner = ora('Searching...').start();
        const searchResult = await twitterCommands.search(query.query, parseInt(searchCount.searchCount) || 10);
        if (searchResult.success) {
          searchSpinner.succeed();
          const searchResults = searchResult.tweets.slice(0, 10).map(t => 
            `  ${chalk.cyan(t.id)} - ${chalk.white(t.text.substring(0, 80))}${t.text.length > 80 ? '...' : ''}`
          ).join('\n');
          const searchBox = boxen(
            chalk.cyan(`Search results for "${query.query}"\n\n`) + searchResults,
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'cyan',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          console.log(centerText(searchBox));
        } else {
          searchSpinner.fail();
          showError(searchResult.error);
        }
        break;

      case '👥 Get User Info':
        const { userQuery } = await inquirer.prompt([
          { type: 'input', name: 'userQuery', message: 'Username (without @):' }
        ]);
        const userInfoSpinner = ora(`Looking up @${userQuery.userQuery}...`).start();
        const userInfoResult = await twitterCommands.getUser(userQuery.userQuery);
        if (userInfoResult.success) {
          userInfoSpinner.succeed();
          const u = userInfoResult.user;
          const userInfoBox = boxen(
            chalk.cyan(`User Profile\n\n`) +
            chalk.white(`  Username: @${u.username}\n`) +
            chalk.white(`  Name:      ${u.name}\n`) +
            chalk.white(`  Bio:       ${u.description || 'No bio'}\n`) +
            chalk.white(`  Location:  ${u.location || 'Not set'}\n`) +
            chalk.white(`  Followers: ${u.public_metrics?.followers_count || 0}\n`) +
            chalk.white(`  Following: ${u.public_metrics?.following_count || 0}\n`) +
            chalk.white(`  Tweets:    ${u.public_metrics?.tweet_count || 0}`),
            {
              padding: 2,
              borderStyle: 'round',
              borderColor: 'cyan',
              backgroundColor: '#000000',
              width: Math.min(TERM_WIDTH - 4, 120)
            }
          );
          console.log(centerText(userInfoBox));
        } else {
          userInfoSpinner.fail();
          showError(userInfoResult.error);
        }
        break;
    }

    await showPause();
  }
}

async function showAudioMenu() {
  // ... (existing audio menu code)
}

async function showNetworkMenu() {
  // ... (existing network menu code)
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
    chalk.blue('🐦 Twitter / X'),
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
    case chalk.blue('🐦 Twitter / X'):
      await showTwitterMenu();
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
  .version('3.1.0');

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

// Twitter commands
program.command('tweet <text>').action(async (text) => {
  const result = await twitterCommands.tweet(text);
  if (result.success) {
    console.log(chalk.green(`✓ Tweet posted! ID: ${result.tweet.data.id}`));
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('timeline [count]').action(async (count = 10) => {
  const result = await twitterCommands.timeline(parseInt(count) || 10);
  if (result.success) {
    result.tweets.forEach(t => {
      console.log(`${chalk.cyan(t.id)} - ${t.text.substring(0, 80)}${t.text.length > 80 ? '...' : ''}`);
    });
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('usertimeline <username> [count]').action(async (username, count = 10) => {
  const result = await twitterCommands.userTimeline(username, parseInt(count) || 10);
  if (result.success) {
    result.tweets.forEach(t => {
      console.log(`${chalk.cyan(t.id)} - ${t.text.substring(0, 80)}${t.text.length > 80 ? '...' : ''}`);
    });
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('search <query> [count]').action(async (query, count = 10) => {
  const result = await twitterCommands.search(query, parseInt(count) || 10);
  if (result.success) {
    result.tweets.forEach(t => {
      console.log(`${chalk.cyan(t.id)} - ${t.text.substring(0, 80)}${t.text.length > 80 ? '...' : ''}`);
    });
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
});

program.command('user <username>').action(async (username) => {
  const result = await twitterCommands.getUser(username);
  if (result.success) {
    const u = result.user;
    console.log(chalk.cyan('\n=== User Profile ===\n'));
    console.log(`Username: @${u.username}`);
    console.log(`Name: ${u.name}`);
    console.log(`Bio: ${u.description || 'No bio'}`);
    console.log(`Location: ${u.location || 'Not set'}`);
    console.log(`Followers: ${u.public_metrics?.followers_count || 0}`);
    console.log(`Following: ${u.public_metrics?.following_count || 0}`);
    console.log(`Tweets: ${u.public_metrics?.tweet_count || 0}`);
  } else {
    console.error(chalk.red(`✗ Error: ${result.error}`));
    process.exit(1);
  }
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

module.exports = {
  fileCommands,
  systemCommands,
  devCommands,
  networkCommands,
  twitterCommands,
  ttsCommands
};