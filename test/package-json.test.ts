import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('package scripts', () => {
  it('uses the compiled server entry for npm start', () => {
    const packageJson = JSON.parse(readFileSync(join(import.meta.dirname, '../package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.start).toBe('node dist/src/server.js');
  });
});
