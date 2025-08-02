import path from 'node:path';
import { countDeclarations, countLOC, loadFileContent, parseCodeToAST } from '@fanoosjs/core';

export default defineEventHandler<{
  query: {
    path: string;
  };
}>(async (e) => {
  const query = getQuery(e);

  const content = await loadFileContent(path.join('../..', query.path));

  const ast = await parseCodeToAST(path.join('../..', query.path), content);

  const loc = countLOC(content);
  const declarations = countDeclarations(ast.program);

  return { loc, declarations };
});
