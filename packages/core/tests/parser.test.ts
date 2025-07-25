import type { ScannedFile } from '../src/scanner';
import { describe, expect, it } from 'vitest';
import { parseCodeToAST, parseScannedFiles } from '../src/parser';

describe('parseCodeToAST', () => {
  const sampleTS = `
        export function greet(name: string): string {
          return 'Hello,' + name;
        }`;

  it('parses valid TypeScript code to AST', async () => {
    const { program: ast } = await parseCodeToAST('example.ts', sampleTS);
    expect(ast.type).toBe('Program');
    expect(ast.body.length).toBeGreaterThan(0);
  });

  it('should return error on invalid code', async () => {
    const badCode = `const = ;`;

    const { errors } = await parseCodeToAST('invalid.ts', badCode);
    expect(errors).toHaveLength(1);
  });
  it('should throws error on invalid format', async () => {
    const code = `print(1)`;

    expect(async () => await parseCodeToAST('invalidFormat.py', code)).rejects.toThrowError(/Failed to parse invalidFormat.py/);
  });
});

describe('parseScannedFiles', () => {
  const mockFiles: ScannedFile[] = [
    {
      filePath: '/project/greet.ts',
      content: `export function greet(name: string) { return 'Hi ' + name; }`,
    },
    {
      filePath: '/project/util.ts',
      content: `const add = (a, b) => a + b;`,
    },
  ];

  it('parses multiple scanned files into ASTs', async () => {
    const parsed = await parseScannedFiles(mockFiles);
    expect(parsed).toHaveLength(2);

    expect(parsed[0].ast.program.type).toBe('Program');
    expect(parsed[1].filePath).toBe('/project/util.ts');
  });
});
