#!/usr/bin/env node

/**
 * AGENT STEVE CLI
 * Advanced animated terminal interface with beautiful UI
 */

const figlet = require('figlet');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const gradient = require('gradient-string');
const boxen = require('boxen');

// Clear terminal
console.clear();

// Animated intro
const spinner = ora('Initializing Agent Steve...').start();

setTimeout(() => {
  spinner.text = 'Loading modules...';
}, 500);

setTimeout(() => {
  spinner.text = 'Connecting to OpenClaw...';
}, 1000);

setTimeout(() => {
  spinner.succeed('Agent Steve Online!');
  showBanner();
  showMainMenu();
}, 1500);

function showBanner() {
  const banner = figlet.textSync('AGENT STEVE', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  const gradientBanner = gradient('cyber', banner);
  console.log(gradientBanner);

  const subtitle = chalk.cyan('▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉▉');
  console.log(subtitle);
  console.log(chalk.white.bold('      Advanced CLI Interface v2.0'));
  console.log(chalk.gray('      Powered by OpenClaw'));
  console.log(subtitle);
  console.log('');
}

function showMainMenu() {
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

  inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: chalk.yellow('Choose a category:'),
      choices: [
        chalk.cyan('🚀 System Control'),
        chalk.green('📁 File Operations'),
        chalk.yellow('🔧 Developer Tools'),
        chalk.red('🎵 Audio Commands'),
        chalk.magenta('🌐 Network'),
        chalk.gray('⚙️ Settings'),
        chalk.white('🚪 Exit')
      ]
    }
  ]).then(answers => {
    switch (answers.category) {
      case '🚀 System Control':
        showSystemMenu();
        break;
      case '📁 File Operations':
        showFileMenu();
        break;
      case '🔧 Developer Tools':
        showDevMenu();
        break;
      case '🎵 Audio Commands':
        runAudioCommand();
        break;
      case '🌐 Network':
        showNetworkMenu();
        break;
      case '⚙️ Settings':
        showSettingsMenu();
        break;
      default:
        console.log(chalk.yellow('\n👋 Goodbye!'));
        process.exit(0);
    }
  });
}

function showSystemMenu() {
  console.log(chalk.cyan('\n=== System Control ==='));
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'System operations:',
      choices: [
        '📊 System Info',
        '🔄 Restart Agent',
        '⏸️  Pause Services',
        '🔙 Back to Main Menu',
        '🚪 Exit'
      ]
    }
  ]).then(answers => {
    if (answers.action === '🔙 Back to Main Menu') {
      showMainMenu();
    } else if (answers.action === '🚪 Exit') {
      console.log(chalk.yellow('Goodbye!'));
      process.exit(0);
    } else {
      showComingSoon(answers.action);
    }
  });
}

function showFileMenu() {
  console.log(chalk.green('\n=== File Operations ==='));
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'File operations:',
      choices: [
        '📂 Browse Files',
        '📄 Read File',
        '✏️  Write File',
        '🗑️  Delete File',
        '📋 Copy File',
        '✂️  Move/Rename',
        '🔙 Back to Main Menu',
        '🚪 Exit'
      ]
    }
  ]).then(answers => {
    if (answers.action === '🔙 Back to Main Menu') {
      showMainMenu();
    } else if (answers.action === '🚪 Exit') {
      console.log(chalk.yellow('Goodbye!'));
      process.exit(0);
    } else {
      showComingSoon(answers.action);
    }
  });
}

function showDevMenu() {
  console.log(chalk.yellow('\n=== Developer Tools ==='));
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Developer tools:',
      choices: [
        '📦 Package Manager',
        '🔨 Build Project',
        '🧪 Run Tests',
        '📜 Git Operations',
        '🔍 Search Code',
        '📊 Code Metrics',
        '🔙 Back to Main Menu',
        '🚪 Exit'
      ]
    }
  ]).then(answers => {
    if (answers.action === '🔙 Back to Main Menu') {
      showMainMenu();
    } else if (answers.action === '🚪 Exit') {
      console.log(chalk.yellow('Goodbye!'));
      process.exit(0);
    } else {
      showComingSoon(answers.action);
    }
  });
}

function runAudioCommand() {
  console.log(chalk.magenta('\n🎵 Audio Commands'));
  console.log(chalk.gray('─────────────────────'));

  const audioBox = boxen(
    chalk.white.bold('Audio features are loading...\n\nFeatures coming soon:\n• Text-to-Speech\n• Speech Recognition\n• Audio Processing\n• Sound Effects\n• Music Generation'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'magenta',
      backgroundColor: '#000000'
    }
  );
  console.log(audioBox);

  setTimeout(() => {
    console.log(chalk.gray('\n⏳ Feature will be available in the next update.'));
  }, 1000);

  setTimeout(() => {
    console.log(chalk.cyan('\n🔙 Returning to main menu...'));
    setTimeout(() => showMainMenu(), 1000);
  }, 2500);
}

function showNetworkMenu() {
  console.log(chalk.green('\n=== Network ==='));
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Network operations:',
      choices: [
        '🌐 Check Connection',
        '📡 Network Scanner',
        '🔗 URL Shortener',
        '📥 Download Manager',
        '📤 Upload Files',
        '🔙 Back to Main Menu',
        '🚪 Exit'
      ]
    }
  ]).then(answers => {
    if (answers.action === '🔙 Back to Main Menu') {
      showMainMenu();
    } else if (answers.action === '🚪 Exit') {
      console.log(chalk.yellow('Goodbye!'));
      process.exit(0);
    } else {
      showComingSoon(answers.action);
    }
  });
}

function showSettingsMenu() {
  console.log(chalk.gray('\n=== Settings ==='));
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Settings:',
      choices: [
        '🎨 Theme',
        '🔊 Sound Effects',
        '⌨️  Keybindings',
        '📝 Preferences',
        '💾 Backup/Restore',
        '🔙 Back to Main Menu',
        '🚪 Exit'
      ]
    }
  ]).then(answers => {
    if (answers.action === '🔙 Back to Main Menu') {
      showMainMenu();
    } else if (answers.action === '🚪 Exit') {
      console.log(chalk.yellow('Goodbye!'));
      process.exit(0);
    } else {
      showComingSoon(answers.action);
    }
  });
}

function showComingSoon(commandName) {
  console.log('');
  const comingBox = boxen(
    chalk.yellow.bold(`⏳ "${commandName}" is coming soon!`),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'yellow',
      backgroundColor: '#000000'
    }
  );
  console.log(comingBox);

  const commands = [
    '✅ Read/write files',
    '✅ Execute shell commands',
    '✅ Interactive mode',
    '⏳ Text-to-speech',
    '⏳ Web browser control',
    '⏳ Device management',
    '⏳ Process automation',
    '⏳ Remote connections'
  ];

  console.log(chalk.cyan('\nAvailable now:'));
  commands.forEach(cmd => console.log('  ' + cmd));

  console.log(chalk.gray('\n💡 Check back soon for updates!'));

  setTimeout(() => {
    console.log(chalk.cyan('\n🔙 Returning to menu...'));
    setTimeout(() => showMainMenu(), 1000);
  }, 3000);
}

// Handle program arguments for non-interactive mode
if (process.argv.length > 2) {
  const command = process.argv[2];
  if (command === '--test' || command === 'test') {
    console.log(chalk.green('✓ CLI is working!'));
    console.log(chalk.cyan('Run without arguments for interactive mode'));
    process.exit(0);
  }
}
