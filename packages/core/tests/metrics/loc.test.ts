import type { LOC } from '../../src/metrics/loc';
import { describe, expect, it } from 'vitest';
import { countLOC } from '../../src/metrics/loc';

describe('countLOC', () => {
  it('counts code, blank, single-line and multi-line comments correctly', () => {
    const sample = `// single comment line

    function foo() {
      console.log('hi'); // inline comment ignored as code
    }

    /* multi-line comment start
     continues
    */

    /**
     * JSDoc comment block
     */

    const x = 1;`;

    const result: LOC = countLOC(sample);
    expect(result.total).toBe(sample.split(/\r?\n/).length);
    expect(result.code).toBe(4); // function foo, console.log, const x, closing bracket?
    expect(result.blank).toBe(4);
    expect(result.comment.singleLine).toBe(1);
    expect(result.comment.multiLine).toBe(3); // two lines inside block, one start
    expect(result.comment.doc).toBe(3); // /**, *, */ lines
  });

  it('handles empty input as one blank line', () => {
    const result = countLOC('');
    expect(result.total).toBe(1);
    expect(result.code).toBe(0);
    expect(result.blank).toBe(1);
    expect(result.comment.singleLine).toBe(0);
    expect(result.comment.multiLine).toBe(0);
    expect(result.comment.doc).toBe(0);
  });

  it('counts multi block comments correctly', () => {
    const sample = `/* outer comment start
    still in outer
    */
    code line
    /* nested comment */`;

    const result = countLOC(sample);
    expect(result.total).toBe(5);
    expect(result.comment.multiLine).toBe(4);
    expect(result.code).toBe(1);
  });

  it('counts inline block comment as code', () => {
    const sample = `const a = 2; /* inline comment */`;

    const result = countLOC(sample);
    expect(result.total).toBe(1);
    expect(result.code).toBe(1);
    expect(result.comment.multiLine).toBe(0);
  });

  it('do not detects unterminated block comments', () => {
    const sample = `/* comment without end
    still comment
    function foo() {}`;

    const result = countLOC(sample);
    expect(result.comment.multiLine).toBe(3);
    expect(result.code).toBe(0);
  });
});
