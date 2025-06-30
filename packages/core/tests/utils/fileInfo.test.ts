import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getFileInfo } from '../../src/utils/fileInfo';

describe('analyzeFile', () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'temp-test-'));
  const tempFilePath = path.join(tempDir, 'test.txt');
  const tempDirPath = path.join(tempDir, 'subdir');

  beforeAll(async () => {
    // Setup: create a temp file and directory
    await fs.ensureDir(tempDirPath);
    await fs.writeFile(tempFilePath, 'Hello, FanoosJS!');
  });

  afterAll(async () => {
    // Cleanup
    await fs.remove(tempDir);
  });

  it('should return correct FileInfo for a file', () => {
    const info = getFileInfo(tempFilePath);
    expect(info.filePath).toBe(tempFilePath);
    expect(info.dir).toBe(path.dirname(tempFilePath));
    expect(info.base).toBe(path.basename(tempFilePath));
    expect(info.name).toBe('test');
    expect(info.ext).toBe('.txt');
    expect(info.size).toBeGreaterThan(0);
    expect(info.isFile).toBe(true);
    expect(info.isDirectory).toBe(false);
    expect(info.birthtime).toBeInstanceOf(Date);
    expect(info.mtime).toBeInstanceOf(Date);
  });

  it('should return correct FileInfo for a directory', () => {
    const info = getFileInfo(tempDirPath);
    expect(info.filePath).toBe(tempDirPath);
    expect(info.isFile).toBe(false);
    expect(info.isDirectory).toBe(true);
  });

  it('should throw error if file does not exist', () => {
    const nonExistentPath = path.join(tempDir, 'no-file.xyz');
    expect(() => getFileInfo(nonExistentPath)).toThrowError(
      new RegExp(`Failed to stat file: ${nonExistentPath}`),
    );
  });

  it('should correctly handle a file with no extension', async () => {
    const noExtPath = path.join(tempDir, 'README');
    await fs.writeFile(noExtPath, 'No extension here');
    const info = getFileInfo(noExtPath);
    expect(info.name).toBe('README');
    expect(info.ext).toBe('');
  });

  it('should correctly handle a deeply nested file', async () => {
    const nestedDir = path.join(tempDir, 'a/b/c');
    const nestedFile = path.join(nestedDir, 'nested.ts');
    await fs.ensureDir(nestedDir);
    await fs.writeFile(nestedFile, 'console.log("nested");');
    const info = getFileInfo(nestedFile);
    expect(info.name).toBe('nested');
    expect(info.ext).toBe('.ts');
    expect(info.dir.endsWith('a/b/c')).toBe(true);
  });
});
