import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { createPrismaClient } from '../prisma/seed.js';
import { buildDefaultMigrationReport, importNormalizedRows, normalizeLegacyRows } from '../src/lib/migration.js';
import { createLegacyMysqlConnection, ensureSqliteSchema, loadMigrationConfig, readLegacyDataset, restoreDumpToDockerMysql, summarizeLegacyDataset } from './migration-helpers.js';

async function main() {
  const config = loadMigrationConfig();

  if (config.restoreDump) {
    console.log(`Restoring ${config.dumpPath} into MySQL database ${config.mysqlDatabase}...`);
    await restoreDumpToDockerMysql(config);
  }

  console.log(`Connecting to MySQL ${config.mysqlHost}:${config.mysqlPort}/${config.mysqlDatabase}...`);
  const legacyConnection = await createLegacyMysqlConnection(config);

  try {
    console.log('Reading legacy rows from MySQL...');
    const dataset = await readLegacyDataset(legacyConnection);
    const sourceCounts = summarizeLegacyDataset(dataset);
    console.log(`Loaded legacy rows: ${JSON.stringify(sourceCounts)}`);

    const report = buildDefaultMigrationReport();
    console.log('Normalizing legacy rows...');
    const normalized = await normalizeLegacyRows({
      ...dataset,
      report
    });

    console.log(`Resetting SQLite schema at ${config.sqliteUrl}...`);
    ensureSqliteSchema(config.sqliteUrl);

    const prisma = createPrismaClient(config.sqliteUrl);

    try {
      console.log('Importing normalized rows into SQLite...');
      const importedCounts = await importNormalizedRows(prisma, normalized, {
        onProgress: async (update) => {
          console.log(`[import] ${update.table}: ${update.inserted}/${update.total}`);
        },
        reset: false
      });

      const reportPayload = {
        config: {
          dumpPath: config.dumpPath,
          mysqlDatabase: config.mysqlDatabase,
          mysqlHost: config.mysqlHost,
          mysqlPort: config.mysqlPort,
          restoreDump: config.restoreDump,
          sqliteUrl: config.sqliteUrl
        },
        duplicates: report.duplicates,
        generatedAt: new Date().toISOString(),
        importedCounts,
        invalidBookmarks: report.invalidBookmarks,
        invalidNotes: report.invalidNotes,
        orphanRows: report.orphanRows,
        passwordResets: report.passwordResets,
        skipped: report.skipped,
        sourceCounts
      };
      const suspiciousUrlPayload = {
        count: report.invalidBookmarks.length,
        generatedAt: reportPayload.generatedAt,
        items: report.invalidBookmarks
      };
      const suspiciousUrlPath = join(dirname(config.reportPath), 'suspicious-bookmark-urls.json');

      await mkdir(dirname(config.reportPath), { recursive: true });
      await writeFile(config.reportPath, `${JSON.stringify(reportPayload, null, 2)}\n`, 'utf8');
      await writeFile(suspiciousUrlPath, `${JSON.stringify(suspiciousUrlPayload, null, 2)}\n`, 'utf8');

      console.log('Migration completed.');
      console.log(
        JSON.stringify(
          {
            importedCounts,
            passwordResets: report.passwordResets.length,
            reportPath: config.reportPath,
            suspiciousUrlCount: report.invalidBookmarks.length,
            suspiciousUrlPath,
            skipped: report.skipped,
            sourceCounts
          },
          null,
          2
        )
      );
    } finally {
      await prisma.$disconnect();
    }
  } finally {
    await legacyConnection.end();
  }
}

await main();
