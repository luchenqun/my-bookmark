import { join } from 'node:path';

export function resolveStaticRoot(cwd = process.cwd()) {
  return join(cwd, 'public');
}
