import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import mysql from 'mysql2/promise';

import type { LegacyAdviceRow, LegacyBookmarkRow, LegacyNoteRow, LegacyTagRow, LegacyUserRow } from '../src/lib/migration.js';

export interface MigrationConfig {
  dumpPath: string;
  mysqlDatabase: string;
  mysqlDockerContainer: string;
  mysqlHost: string;
  mysqlPassword: string;
  mysqlPort: number;
  mysqlUser: string;
  reportPath: string;
  restoreDump: boolean;
  sqliteUrl: string;
}

export interface LegacyDataset {
  advices: LegacyAdviceRow[];
  bookmarks: LegacyBookmarkRow[];
  notes: LegacyNoteRow[];
  tags: LegacyTagRow[];
  users: LegacyUserRow[];
}

export function getProjectRoot() {
  return resolve(import.meta.dirname, '..');
}

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (!value) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function loadMigrationConfig(env: NodeJS.ProcessEnv = process.env): MigrationConfig {
  const projectRoot = getProjectRoot();

  return {
    dumpPath: env.MYSQL_DUMP_PATH ? resolve(projectRoot, env.MYSQL_DUMP_PATH) : resolve(projectRoot, '..', 'mybookmarks_backup.sql'),
    mysqlDatabase: env.MYSQL_DATABASE || 'mybookmarks',
    mysqlDockerContainer: env.MYSQL_DOCKER_CONTAINER || 'mysql',
    mysqlHost: env.MYSQL_HOST || '127.0.0.1',
    mysqlPassword: env.MYSQL_PASSWORD || '123456',
    mysqlPort: Number(env.MYSQL_PORT || 3306),
    mysqlUser: env.MYSQL_USER || 'root',
    reportPath: env.MIGRATION_REPORT_PATH ? resolve(projectRoot, env.MIGRATION_REPORT_PATH) : join(projectRoot, 'data', 'migration-report.json'),
    restoreDump: parseBoolean(env.MIGRATION_RESTORE_DUMP, false),
    sqliteUrl: env.MIGRATION_DATABASE_URL || env.DATABASE_URL || 'file:./data/app.db'
  };
}

export async function restoreDumpToDockerMysql(config: MigrationConfig) {
  const dumpContent = await readFile(config.dumpPath);
  const passwordFlag = `-p${config.mysqlPassword}`;

  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      config.mysqlDockerContainer,
      'mysql',
      `-u${config.mysqlUser}`,
      passwordFlag,
      '-e',
      `DROP DATABASE IF EXISTS \`${config.mysqlDatabase}\`; CREATE DATABASE \`${config.mysqlDatabase}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`
    ],
    {
      stdio: 'inherit'
    }
  );

  execFileSync('docker', ['exec', '-i', config.mysqlDockerContainer, 'mysql', `-u${config.mysqlUser}`, passwordFlag, config.mysqlDatabase], {
    input: dumpContent,
    stdio: ['pipe', 'inherit', 'inherit']
  });
}

export async function createLegacyMysqlConnection(config: MigrationConfig) {
  return mysql.createConnection({
    host: config.mysqlHost,
    port: config.mysqlPort,
    user: config.mysqlUser,
    password: config.mysqlPassword,
    database: config.mysqlDatabase,
    charset: 'utf8mb4'
  });
}

async function selectRows<T>(connection: mysql.Connection, query: string) {
  const [rows] = await connection.query(query);
  return rows as T[];
}

export async function readLegacyDataset(connection: mysql.Connection): Promise<LegacyDataset> {
  const [users, tags, bookmarks, advices, notes] = await Promise.all([
    selectRows<LegacyUserRow>(connection, 'SELECT * FROM `users` ORDER BY `id` ASC'),
    selectRows<LegacyTagRow>(connection, 'SELECT * FROM `tags` ORDER BY `id` ASC'),
    selectRows<LegacyBookmarkRow>(connection, 'SELECT * FROM `bookmarks` ORDER BY `id` ASC'),
    selectRows<LegacyAdviceRow>(connection, 'SELECT * FROM `advices` ORDER BY `id` ASC'),
    selectRows<LegacyNoteRow>(connection, 'SELECT * FROM `notes` ORDER BY `id` ASC')
  ]);

  return {
    users,
    tags,
    bookmarks,
    advices,
    notes
  };
}

export function summarizeLegacyDataset(dataset: LegacyDataset) {
  return {
    advices: dataset.advices.length,
    bookmarks: dataset.bookmarks.length,
    notes: dataset.notes.length,
    tags: dataset.tags.length,
    users: dataset.users.length
  };
}

export function ensureSqliteSchema(sqliteUrl: string) {
  execFileSync('npx', ['prisma', 'db', 'push', '--force-reset', '--url', sqliteUrl], {
    cwd: getProjectRoot(),
    stdio: 'inherit'
  });
}
