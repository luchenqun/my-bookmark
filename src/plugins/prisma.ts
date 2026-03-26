import { mkdir, readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const require = createRequire(import.meta.url);
const BetterSqlite3 = require('better-sqlite3') as new (path: string) => {
  prepare: (sql: string) => { get: () => unknown };
  exec: (sql: string) => void;
  close: () => void;
};

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

interface PrismaPluginOptions {
  databaseUrl?: string;
}

function resolveSqlitePath(databaseUrl: string) {
  if (!databaseUrl.startsWith('file:')) {
    return null;
  }

  const filePath = databaseUrl.slice('file:'.length);
  if (!filePath || filePath === ':memory:') {
    return null;
  }

  return filePath.startsWith('/') ? filePath : resolve(process.cwd(), filePath);
}

async function loadMigrationSql() {
  const migrationsDir = join(process.cwd(), 'prisma/migrations');
  const entries = await readdir(migrationsDir, {
    withFileTypes: true
  });
  const migrationDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const sqlStatements = await Promise.all(migrationDirs.map((dir) => readFile(join(migrationsDir, dir, 'migration.sql'), 'utf8')));

  return sqlStatements;
}

async function ensureSqliteSchema(databaseUrl: string) {
  const databasePath = resolveSqlitePath(databaseUrl);
  if (!databasePath) {
    return;
  }

  await mkdir(dirname(databasePath), {
    recursive: true
  });

  const db = new BetterSqlite3(databasePath);

  try {
    const existingUsersTable = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
    if (existingUsersTable) {
      return;
    }

    const migrations = await loadMigrationSql();
    for (const migration of migrations) {
      db.exec(migration);
    }
  } finally {
    db.close();
  }
}

export default fp<PrismaPluginOptions>(
  async function prismaPlugin(fastify, options) {
    const databaseUrl = options.databaseUrl || process.env.DATABASE_URL || 'file:./data/app.db';
    process.env.DATABASE_URL = databaseUrl;
    await ensureSqliteSchema(databaseUrl);

    const prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: databaseUrl
      })
    });

    fastify.decorate('prisma', prisma);
    fastify.addHook('onClose', async () => {
      await prisma.$disconnect();
    });
  },
  {
    name: 'prisma-plugin'
  }
);
