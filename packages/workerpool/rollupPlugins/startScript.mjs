import { spawn } from 'child_process';

// const { exec } = require('child_process');
export function startScript(script) {
  let isFirstBuildEnd = true;

  return {
    async buildEnd() {
      if (isFirstBuildEnd) {
        const child = spawn(script, { shell: true });
        child.stdout.on('data', (data) => {
          console.log(`playground output: ${data}, time: ${new Date().getTime()}`);
        });

        child.stderr.on('data', (data) => {
          console.error(`playground error: ${data}, time: ${new Date().getTime()}`);
        });

        child.on('error', (error) => {
          console.error(
            `error executing playground: ${error.message}, time: ${new Date().getTime()}`
          );
        });

        child.on('close', (code) => {
          console.log(`playground process exited with code ${code}, time: ${new Date().getTime()}`);
        });

        isFirstBuildEnd = false;
      }
    }
  };
}
