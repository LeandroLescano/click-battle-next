const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Do you want to update backup before running 'npm run dev'? (y/N): ", (answer) => {
  rl.close();

  let command = 'npm';
  let args = ['run', 'dev:start'];

  if (answer.match(/^[Yy]$/)) {
    console.log('Updating backup...');
    const backup = spawn('npm', ['run', 'update-backup'], { stdio: 'inherit', shell: true });

    backup.on('close', (code) => {
      if (code === 0) {
        console.log('Backup updated successfully. Starting dev server...');
        spawn(command, args, { stdio: 'inherit', shell: true });
      } else {
        console.error(`Backup failed with code ${code}`);
        process.exit(code);
      }
    });
  } else {
    console.log('Starting dev server...');
    spawn(command, args, { stdio: 'inherit', shell: true });
  }
});
