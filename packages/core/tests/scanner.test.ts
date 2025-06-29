import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadFileContent, scanFiles, scanProject } from '../src/scanner';

describe('fileScanner', () => {
  let tempDir: string;
  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    // Create test files
    await fs.outputFile(path.join(tempDir, 'a.ts'), 'console.log("a");');
    await fs.outputFile(path.join(tempDir, 'sub/b.js'), 'console.log("b");');
    await fs.outputFile(path.join(tempDir, 'c.txt'), 'not code');
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('should find ts and js files', async () => {
    const files = await scanFiles(tempDir, ['**/*.ts', '**/*.js']);
    const basenames = files.map(f => path.basename(f)).sort();

    expect(basenames).toEqual(['a.ts', 'b.js'].sort());
  });

  it('should return empty array for no matches', async () => {
    const files = await scanFiles(tempDir, ['**/*.md']);

    expect(files).toEqual([]);
  });

  it('should not included files in .gitignore', async () => {
    await fs.outputFile(path.join(tempDir, '.gitignore'), 'sub/');

    const files = await scanFiles(tempDir);
    const basenames = files.map(f => path.basename(f)).sort();

    expect(basenames).not.to.contain('b.js');
  });
});

describe('contentLoader', () => {
  let tempFile: string;
  beforeAll(async () => {
    tempFile = path.join('', 'content-test.txt');

    await fs.outputFile(tempFile, 'Hello, World!');
  });

  afterAll(async () => {
    await fs.remove(tempFile);
  });

  it('should load file content correctly', async () => {
    const content = await loadFileContent(tempFile);
    expect(content).toBe('Hello, World!');
  });

  it('should throw error for non-existent file', async () => {
    expect(async () => {
      await loadFileContent(path.join(tempFile, 'nope.txt'));
    }).rejects.toThrowError();
  });
});

describe('scanProject', () => {
  let tempDir: string;
  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'proj-test-'));

    await fs.outputFile(path.join(tempDir, 'x.ts'), 'const x = 1;');
    await fs.outputFile(path.join(tempDir, 'y.js'), 'const y = 2;');
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('should scan and load files', async () => {
    const scanned = await scanProject(tempDir);
    const paths = scanned.map(s => path.basename(s.filePath)).sort();
    expect(paths).toEqual(['x.ts', 'y.js'].sort());
    expect(scanned[0].content).toContain('const');
  });

  it('should return empty array if no code files', async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'empty-proj-'));
    const scanned = await scanProject(emptyDir);
    expect(scanned).toEqual([]);
    await fs.remove(emptyDir);
  });
});
