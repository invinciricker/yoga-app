/**
 * Screens and parts read their colours with useTheme(), never by importing them, so that every
 * colour follows the theme (light or dark). This test fails if a file in app/ or src/ (outside
 * src/theme/) imports a colour from the theme.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = join(__dirname, '..', '..');
const themeDir = join(root, 'src', 'theme');

/** Names that hold colour values. `color` is the old name of the dark palette. */
const forbidden = ['color', 'palette', 'onCover', 'tokens'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return path === themeDir ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

/** The names a file imports from the theme ("@/theme", "../theme", "./tokens"…), and namespace imports. */
function themeImports(text: string): string[] {
  const names: string[] = [];
  const pattern = /import\s+(type\s+)?([^;]*?)\s+from\s+['"]([^'"]+)['"]/g;
  for (const [, typeOnly, what, from] of text.matchAll(pattern)) {
    if (typeOnly || !/(^@\/theme|\/theme|\/tokens)(\/index|\/tokens)?$/.test(from)) continue;
    if (/\*\s+as\s+/.test(what)) names.push('* (namespace)');
    const braces = /\{([^}]*)\}/s.exec(what);
    if (!braces) continue;
    for (const part of braces[1].split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0];
      if (name && !part.trim().startsWith('type ')) names.push(name);
    }
  }
  return names;
}

describe('colours come from useTheme()', () => {
  const files = [...sourceFiles(join(root, 'app')), ...sourceFiles(join(root, 'src'))];

  it('finds the files to check', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('no file outside src/theme imports a colour', () => {
    const offenders = files.flatMap((file) =>
      themeImports(readFileSync(file, 'utf8'))
        .filter((name) => forbidden.includes(name) || name.startsWith('*'))
        .map((name) => `${relative(root, file).split(sep).join('/')} imports ${name}`),
    );
    expect(offenders).toEqual([]);
  });

  it('would catch an offender', () => {
    expect(themeImports("import { color, space } from '@/theme';")).toContain('color');
    expect(themeImports("import { palette } from '../theme/tokens';")).toContain('palette');
    expect(themeImports("import { space, type Palette } from '@/theme';")).toEqual(['space']);
  });
});
