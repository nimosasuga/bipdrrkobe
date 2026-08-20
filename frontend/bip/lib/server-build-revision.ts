import fs from 'node:fs';
import path from 'node:path';

const REVISION_FILE = 'build-revision.txt';

export function getBuildRevision(): string {
  try {
    const value = fs.readFileSync(path.join(process.cwd(), REVISION_FILE), 'utf8').trim();
    return value || 'development';
  } catch {
    return 'development';
  }
}
