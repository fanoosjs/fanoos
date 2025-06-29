import path from 'node:path';
import { loadFileContent } from './contentLoader';
import { scanFiles } from './fileScanner';

/**
 * Represents a file and its content within the project.
 */
export interface ScannedFile {
  /** Absolute path to the file */
  filePath: string;
  /** Raw content of the file */
  content: string;
}

/**
 * Scans a project directory for source files and loads their content.
 * @param projectRoot The root directory of the project
 * @returns Array of ScannedFile objects
 */
export async function scanProject(
  projectRoot: string,
): Promise<ScannedFile[]> {
  const patterns = ['**/*.ts', '**/*.js'];
  const filePaths = await scanFiles(projectRoot, patterns);

  const scanned: ScannedFile[] = [];

  for (const filePath of filePaths) {
    const content = await loadFileContent(path.join(projectRoot, filePath));
    scanned.push({
      filePath: path.normalize(filePath),
      content,
    });
  }

  return scanned;
}
