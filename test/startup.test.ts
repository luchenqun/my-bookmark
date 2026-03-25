import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { formatStartupUrls, loadRuntimeEnv, resolvePort } from '../src/lib/startup.js';

const originalCwd = process.cwd();
const originalPort = process.env.PORT;

afterEach(() => {
  process.chdir(originalCwd);

  if (originalPort === undefined) {
    delete process.env.PORT;
    return;
  }

  process.env.PORT = originalPort;
});

describe('startup logging', () => {
  it('defaults app port to 8157 when PORT is absent', () => {
    expect(resolvePort({})).toBe(8157);
  });

  it('loads PORT from a local .env file before resolving startup port', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'bookmark-startup-'));

    try {
      writeFileSync(join(tempDir, '.env'), 'PORT=3000\n', 'utf8');
      delete process.env.PORT;
      process.chdir(tempDir);

      loadRuntimeEnv();

      expect(resolvePort()).toBe(3000);
    } finally {
      rmSync(tempDir, { force: true, recursive: true });
    }
  });

  it('formats local and network urls for startup output', () => {
    expect(formatStartupUrls(3000, 'http://0.0.0.0:3000')).toEqual(['Local: http://localhost:3000', 'Network: http://0.0.0.0:3000']);
  });
});
