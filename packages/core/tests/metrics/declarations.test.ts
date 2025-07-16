import type { Program } from 'oxc-parser';
import type { DeclarationMetrics } from '../../src/metrics/declarations';
import { parseSync } from 'oxc-parser';

import { describe, expect, it } from 'vitest';
import { countDeclarations } from '../../src/metrics/declarations';

function parseSource(source: string): Program {
  return parseSync('test.ts', source, { sourceType: 'module', lang: 'ts' }).program;
}

describe('countDeclarations', () => {
  it('counts all declaration types correctly', () => {
    const code = `
      let a = 1;
      const b = 2;
      var c;
      function foo() {}
      class Bar {}
      type T = string;
      interface I { }
      enum E { A, B }
      namespace N { }
    `;
    const program = parseSource(code);
    const result: DeclarationMetrics = countDeclarations(program);

    expect(result.variableDeclarations).toBe(3);
    expect(result.functionDeclarations).toBe(1);
    expect(result.classDeclarations).toBe(1);
    expect(result.typeAliases).toBe(1);
    expect(result.interfaces).toBe(1);
    expect(result.enums).toBe(1);
    expect(result.namespaces).toBe(1);
  });

  it('returns zeros on empty program', () => {
    const program = parseSource('');
    const result = countDeclarations(program);
    expect(Object.values(result).every(v => v === 0)).toBe(true);
  });
});
