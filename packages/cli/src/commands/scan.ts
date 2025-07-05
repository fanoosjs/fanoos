import { Command } from 'commander';
import { scanFiles } from 'fanoos';

export const scanCommand = new Command('scan')
  .description('Scan and analyze your project files')
  .option('-p, --path <path>', 'Path to scan', '.')
  .action(async (options) => {
    try {
      const files = await scanFiles(options.path);
      console.log(`Found ${files.length} files.`);
      files.forEach(file => console.log(' -', file));
    }
    catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
      }
    }
  });
