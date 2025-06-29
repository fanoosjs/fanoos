import type { ParseResult } from 'oxc-parser';
import type { ScannedFile } from '../scanner';
import { parseCodeToAST } from './astParser';

export interface ParsedFile {
  /** Original file path */
  filePath: string;
  /** AST for the file */
  ast: ParseResult;
}

/**
 * Parses multiple scanned files into ASTs.
 * @param scannedFiles Array of scanned files with content
 * @returns Array of parsed files with ASTs
 */
export function parseScannedFiles(scannedFiles: ScannedFile[]): Promise<ParsedFile[]> {
  return Promise.all(scannedFiles.map(async ({ filePath, content }) => ({
    filePath,
    ast: await parseCodeToAST(filePath, content),
  })));
}
