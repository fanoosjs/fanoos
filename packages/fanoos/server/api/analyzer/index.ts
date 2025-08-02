import path from 'node:path';
import { loadFileContent, parseCodeToAST } from '@fanoosjs/core';

export default defineEventHandler<{
  query: {
    path: string;
  };
}>(async (e) => {
  const query = getQuery(e);

  const content = await loadFileContent(path.join('../..', query.path));

  const ast = await parseCodeToAST(path.join('../..', query.path), content);

  return { ast, content };
});
