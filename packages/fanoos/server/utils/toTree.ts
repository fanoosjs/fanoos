import path from 'node:path';

export interface TreeNode {
  name: string;
  ext: string;
  path: string;
  children?: TreeNode[];
}

interface FileTree {
  [name: string]: FileTree | null;
}

export function buildTree(paths: string[]): TreeNode[] {
  const root: FileTree = {};

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean);
    let current: FileTree = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        current[part] = null;
      }
      else {
        current[part] = current[part] ?? {};
        current = current[part] as FileTree;
      }
    }
  }

  return toTree(root, '');
}

export function toTree(obj: FileTree, parentPath: string): TreeNode[] {
  return Object.entries(obj).map(([name, value]) => {
    const currentPath = path.posix.join(parentPath, name);
    const ext = path.extname(name);
    const isFile = value === null;

    return {
      name,
      ext,
      path: currentPath,
      children: !isFile ? toTree(value, currentPath) : undefined,
    };
  });
}
