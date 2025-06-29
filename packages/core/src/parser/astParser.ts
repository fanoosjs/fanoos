import type { ParseResult } from 'oxc-parser';
import path from 'node:path';
import { parseAsync as parse } from 'oxc-parser';

/**
 * Parses JavaScript or TypeScript source code into an abstract syntax tree (AST).
 * @param filePath The path of the file (used for error context)
 * @param code The source code as a string
 * @returns AST representation of the code
 */
export async function parseCodeToAST(filePath: string, code: string): Promise<ParseResult> {
  try {
    const lang = path.extname(filePath).slice(1) as 'js' | 'ts';

    if (!['ts', 'js'].includes(lang)) {
      throw new Error('file should be js or ts format');
    }

    const parseResult = await parse(path.basename(filePath), code, {
      sourceType: 'module',
      showSemanticErrors: true,
      lang,
      astType: lang,
    });

    return parseResult;
  }
  catch (error) {
    throw new Error(`Failed to parse ${filePath}: ${(error as Error).message}`);
  }
}
