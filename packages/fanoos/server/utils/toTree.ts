import type { TreeItem } from '#ui/types';
import { extname, posix } from 'node:path';

interface FileTree {
  [name: string]: FileTree | null;
}

export function buildTree(paths: string[]): TreeItem[] {
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

export function toTree(obj: FileTree, parentPath: string): TreeItem[] {
  return Object.entries(obj).map(([title, value]) => {
    const path = posix.join(parentPath, title);
    const isFile = value === null;

    return {
      label: `/${title}`,
      icon: isFile ? extname(title).slice(1) : undefined,
      path,
      children: !isFile ? toTree(value, path) : undefined,
    };
  });
}
