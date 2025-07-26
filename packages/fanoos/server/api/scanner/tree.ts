import { scanFiles } from '@fanoosjs/core';
import { buildTree } from '~~/server/utils/toTree';

export default defineEventHandler(async () => {
  const files = await scanFiles('../..');

  return buildTree(files);
});
