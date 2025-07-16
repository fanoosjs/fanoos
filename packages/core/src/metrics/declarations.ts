import type { Program } from 'oxc-parser';

import { walk } from 'oxc-walker';

/**
 * Structure for counting various top-level and block-level declarations.
 */
export interface DeclarationMetrics {
  /** Number of `let`, `const`, or `var` declarations */
  variableDeclarations: number;
  /** Number of function declarations */
  functionDeclarations: number;
  /** Number of class declarations */
  classDeclarations: number;
  /** Number of `type` aliases */
  typeAliases: number;
  /** Number of interfaces */
  interfaces: number;
  /** Number of enums */
  enums: number;
  /** Number of namespaces (TS modules) */
  namespaces: number;
}

/**
 * Count various declaration types from the given TypeScript/JavaScript source.
 *
 * @param program - program paasred from oxc-parser.
 * @returns DeclarationMetrics object with counts of each declaration type
 */
export function countDeclarations(
  program: Program,
): DeclarationMetrics {
  const metrics: DeclarationMetrics = {
    variableDeclarations: 0,
    functionDeclarations: 0,
    classDeclarations: 0,
    typeAliases: 0,
    interfaces: 0,
    enums: 0,
    namespaces: 0,
  };

  walk(program, {
    enter(node) {
      switch (node.type) {
        case 'VariableDeclaration':
          metrics.variableDeclarations++;
          break;
        case 'FunctionDeclaration':
          metrics.functionDeclarations++;
          break;
        case 'ClassDeclaration':
          metrics.classDeclarations++;
          break;
        case 'TSTypeAliasDeclaration':
          metrics.typeAliases++;
          break;
        case 'TSInterfaceDeclaration':
          metrics.interfaces++;
          break;
        case 'TSEnumDeclaration':
          metrics.enums++;
          break;
        case 'TSModuleDeclaration':
          metrics.namespaces++;
          break;
      }
    },
  });

  return metrics;
}
