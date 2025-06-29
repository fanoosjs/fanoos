import process from 'node:process';
import { globby } from 'globby';

/**
 * Scans a directory for files matching given extensions, excluding those in .gitignore.
 * @param baseDir The root directory to scan
 * @param patterns Glob patterns to include
 * @returns Array of matched file paths
 */
export async function scanFiles(
  baseDir: string = process.cwd(),
  patterns: string[] = ['**/*.ts', '**/*.js'],
): Promise<string[]> {
  const matches = await globby(patterns, {
    cwd: baseDir,
    absolute: false,
    gitignore: true,
  });

  return matches;
}
