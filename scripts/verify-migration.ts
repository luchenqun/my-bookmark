import { readFile } from 'node:fs/promises';

import { createPrismaClient } from '../prisma/seed.js';
import { createLegacyMysqlConnection, loadMigrationConfig, readLegacyDataset, summarizeLegacyDataset } from './migration-helpers.js';

async function readExpectedCounts(reportPath: string) {
  try {
    const raw = await readFile(reportPath, 'utf8');
    const parsed = JSON.parse(raw) as {
      importedCounts?: Record<string, number>;
    };

    return parsed.importedCounts ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const config = loadMigrationConfig();
  const legacyConnection = await createLegacyMysqlConnection(config);
  const prisma = createPrismaClient(config.sqliteUrl);

  try {
    const dataset = await readLegacyDataset(legacyConnection);
    const sourceCounts = summarizeLegacyDataset(dataset);
    const expectedCounts = (await readExpectedCounts(config.reportPath)) ?? sourceCounts;
    const targetCounts = {
      advices: await prisma.advice.count(),
      bookmarks: await prisma.bookmark.count(),
      notes: await prisma.note.count(),
      tags: await prisma.tag.count(),
      users: await prisma.user.count()
    };

    const mismatches = Object.entries(expectedCounts)
      .filter(([table, count]) => targetCounts[table as keyof typeof targetCounts] !== count)
      .map(([table, count]) => ({
        expected: count,
        table,
        target: targetCounts[table as keyof typeof targetCounts]
      }));

    const passwordAlgorithms = await prisma.user.groupBy({
      by: ['passwordAlgo'],
      _count: {
        _all: true
      }
    });

    const summary = {
      generatedAt: new Date().toISOString(),
      mismatches,
      passwordAlgorithms,
      expectedCounts,
      reportPath: config.reportPath,
      sourceCounts,
      sqliteUrl: config.sqliteUrl,
      targetCounts
    };

    if (mismatches.length > 0) {
      console.error(JSON.stringify(summary, null, 2));
      process.exitCode = 1;
      return;
    }

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
    await legacyConnection.end();
  }
}

await main();
