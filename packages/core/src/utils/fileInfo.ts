import fs from 'node:fs';
import path from 'node:path';

/**
 * Basic file information and statistics
 */
export interface FileInfo {
  /** Absolute path to the file */
  filePath: string;
  /** Directory name of the file */
  dir: string;
  /** Base name of the file (with extension) */
  base: string;
  /** File name without extension */
  name: string;
  /** File extension (including dot) */
  ext: string;
  /** Size of the file in bytes */
  size: number;
  /** Creation time (birth) */
  birthtime: Date;
  /** Last modification time */
  mtime: Date;
  /** If the path is a file */
  isFile: boolean;
  /** If the path is a directory */
  isDirectory: boolean;
}

/**
 * Analyze a single file and return its FileInfo.
 * @param filePath Absolute path to the file
 * @returns FileInfo object with path details and stats
 * @throws Error if file does not exist or stats cannot be read
 */
export function getFileInfo(filePath: string): FileInfo {
  let stats: fs.Stats;
  try {
    stats = fs.statSync(filePath);
  }
  catch {
    throw new Error(`Failed to stat file: ${filePath}`);
  }

  const parsed = path.parse(filePath);

  return {
    filePath,
    dir: parsed.dir,
    base: parsed.base,
    name: parsed.name,
    ext: parsed.ext,
    size: stats.size,
    birthtime: stats.birthtime,
    mtime: stats.mtime,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
  };
}
