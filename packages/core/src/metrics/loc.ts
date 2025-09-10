/**
 * Represents the breakdown of lines in a source file.
 */
export interface LOC {
  /** Total number of lines (code + blank + comments) */
  total: number;
  /** Number of non-blank, non-comment lines */
  code: number;
  /** Number of blank lines */
  blank: number;
  /** Detailed comment counts */
  comment: {
    /** Number of single-line comments (//) */
    singleLine: number;
    /** Number of multi-line comments */
    multiLine: number;
    /** Number of documentation comments */
    doc: number;
    /** Total number of comments */
    total: number;
  };
}

/**
 * Count lines of code, blank lines, and comments in the given source.
 * Supports distinguishing between single-line, multi-line, and documentation comments.
 *
 * @param source - Raw source code string (e.g., contents of a .ts/.js file)
 * @returns LOC object summarizing counts of lines
 */
export function countLOC(source: string): LOC {
  const lines = source.split(/\r?\n/);

  let code = 0;
  let blank = 0;
  let singleLine = 0;
  let multiLine = 0;
  let doc = 0;

  let inBlock = false;
  let inDocBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      blank++;
      continue;
    }

    // Inside a documentation block
    if (inDocBlock) {
      doc++;
      if (line.endsWith('*/')) {
        inDocBlock = false;
      }
      continue;
    }

    // Inside a multi-line comment block
    if (inBlock) {
      multiLine++;
      if (line.endsWith('*/')) {
        inBlock = false;
      }
      continue;
    }

    // Single-line comment
    if (line.startsWith('//')) {
      singleLine++;
      continue;
    }

    // Documentation comment start
    if (line.startsWith('/**')) {
      doc++;
      if (!line.endsWith('*/')) {
        inDocBlock = true;
      }
      continue;
    }

    // Multi-line comment start
    if (line.startsWith('/*')) {
      multiLine++;
      if (!line.endsWith('*/')) {
        inBlock = true;
      }
      continue;
    }

    // Otherwise, count as code
    code++;
  }

  const total = code + blank + singleLine + multiLine + doc;
  const totalComment = singleLine + multiLine + doc;

  return {
    total,
    code,
    blank,
    comment: {
      singleLine,
      multiLine,
      doc,
      total: totalComment,
    },
  };
}
