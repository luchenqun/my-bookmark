import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

import { buildApp } from '../src/app.js';
import { createPrismaClient, seedDemoData } from '../prisma/seed.js';

export async function buildTestApp() {
  const tempDir = mkdtempSync(join(tmpdir(), 'bookmark-test-'));
  const databasePath = join(tempDir, 'test.db');
  const databaseUrl = `file:${databasePath}`;

  execFileSync('npx', ['prisma', 'db', 'push', '--force-reset', '--url', databaseUrl], {
    cwd: join(import.meta.dirname, '..'),
    stdio: 'ignore'
  });

  process.env.DATABASE_URL = databaseUrl;
  const prisma = createPrismaClient(databaseUrl);
  await seedDemoData(prisma);
  await prisma.$disconnect();

  const app = await buildApp({
    databaseUrl,
    jwtSecret: 'test-secret',
    logger: false
  });

  return {
    app,
    cleanup() {
      rmSync(tempDir, { force: true, recursive: true });
    }
  };
}
