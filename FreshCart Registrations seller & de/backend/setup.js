const { exec } = require('child_process');
const path = require('path');

console.log('Setting up FreshCart Backend...');

// Function to execute commands
function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const process = exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
    
    process.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    process.stderr.on('data', (data) => {
      console.error(data.toString());
    });
  });
}

async function setup() {
  try {
    // Install dependencies
    console.log('Installing dependencies...');
    await runCommand('npm install', path.join(__dirname));
    
    console.log('Dependencies installed successfully!');
    
    // Initialize database (optional)
    console.log('To initialize the database with sample data, run:');
    console.log('node scripts/init-db.js');
    
    console.log('\nSetup completed successfully!');
    console.log('\nTo start the server:');
    console.log('- Development mode: npm run dev');
    console.log('- Production mode: npm start');
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setup();