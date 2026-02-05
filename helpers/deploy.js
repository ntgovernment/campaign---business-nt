const { execSync } = require('child_process');
const path = require('path');

const stagingUser = 'stagmatrix';
const parentDirectory = path.resolve(__dirname, '..');
const currentFolderName = path.basename(parentDirectory).toLowerCase().replace(/[_\s]/g, '-');

console.log('');
console.log('Deploy the latest codebase to the staging site.');
console.log('');
console.log('----------------------------------------');
console.log(`Staging site user: ${stagingUser}`);
console.log('----------------------------------------');
console.log('');

if (stagingUser !== '') {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Are you sure? (y/n) ', (reply) => {
    console.log(); // move to a new line

    if (reply.toLowerCase() === 'y') {
      // Do deployment.
      try {
        const command = `
            npm run build:dev &&
            ssh -p 2929 -o PasswordAuthentication=no root@43.242.69.3 "sudo su - ${stagingUser} -c 'mkdir -p /home/${stagingUser}/public_html/${currentFolderName}'" &&
            scp -r -P 2929 -o PasswordAuthentication=no ./dist/* root@43.242.69.3:/home/${stagingUser}/public_html/${currentFolderName}
        `;
        execSync(command, { stdio: 'inherit' });

        console.log('');
        console.log('Done!');
        console.log('');
      } catch (error) {
        console.error(error.message);
      }
    }

    readline.close();
  });
} else {
  console.log('');
  console.log('Error: stagingUser is empty');
  console.log('');
}