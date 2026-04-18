const { spawn } = require('child_process');
const path = require('path');

// Use the correct command for Windows vs Mac/Linux
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('🚀 Starting RCZ Donor Tracker Development Servers...\n');

// 1. Start the Express Backend (API)
const server = spawn(npmCmd, ['run', 'dev'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit', // This pipes the output directly to your terminal
    shell: true
});

// 2. Start the React Frontend (Vite)
const client = spawn(npmCmd, ['run', 'dev'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit',
    shell: true
});

// Clean up processes if you press Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    server.kill('SIGINT');
    client.kill('SIGINT');
    process.exit();
});