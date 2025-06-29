import fs from 'node:fs/promises';

/**
 * Loads the content of a file as string.
 * @param filePath Absolute path to the file
 * @returns File content
 * @throws Error if reading fails
 */
export async function loadFileContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  }
  catch {
    throw new Error(`Failed to load file content: ${filePath}`);
  }
}
