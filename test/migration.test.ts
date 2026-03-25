import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildDefaultMigrationReport, importNormalizedRows, normalizeLegacyRows } from '../src/lib/migration.js';
import { createPrismaClient } from '../prisma/seed.js';

function md5(value: string) {
  return createHash('md5').update(value).digest('hex');
}

describe('migration normalization', () => {
  it('normalizes legacy rows, falls back missing tags, and reports suspicious urls', async () => {
    const now = new Date('2026-03-25T00:00:00.000Z');
    const report = buildDefaultMigrationReport();

    const result = await normalizeLegacyRows({
      advices: [
        {
          id: 300,
          userId: 1,
          comment: 'hello',
          createdAt: '2020-01-05 12:00:00',
          state: 0
        },
        {
          id: 301,
          userId: 999,
          comment: 'orphan advice',
          createdAt: '2020-01-05 12:00:00',
          state: 0
        }
      ],
      bookmarks: [
        {
          id: 200,
          userId: 1,
          tagId: 100,
          title: '',
          description: 'ok',
          url: 'https://example.com/',
          public: 1,
          clickCount: 5,
          createdAt: '2020-01-03 12:00:00',
          lastClick: '2020-01-04 12:00:00'
        },
        {
          id: 201,
          userId: 1,
          tagId: 100,
          title: 'Broken bookmark',
          description: null,
          url: 'javascript:alert(1)',
          public: 0,
          clickCount: 1,
          createdAt: '2020-01-03 12:00:00',
          lastClick: '2020-01-04 12:00:00'
        },
        {
          id: 202,
          userId: 1,
          tagId: 404,
          title: 'Orphan bookmark',
          description: null,
          url: 'https://example.org/',
          public: 0,
          clickCount: 1,
          createdAt: '2020-01-03 12:00:00',
          lastClick: '2020-01-04 12:00:00'
        }
      ],
      notes: [
        {
          id: 400,
          userId: 1,
          tagId: 100,
          content: 'good note',
          createdAt: '2020-01-06 12:00:00',
          public: 1
        },
        {
          id: 401,
          userId: 999,
          tagId: 100,
          content: 'orphan note',
          createdAt: '2020-01-06 12:00:00',
          public: 1
        },
        {
          id: 402,
          userId: 1,
          tagId: 777,
          content: '',
          createdAt: '2020-01-06 12:00:00',
          public: 0
        },
        {
          id: 403,
          userId: 1,
          tagId: 777,
          content: 'needs fallback tag',
          createdAt: '2020-01-06 12:00:00',
          public: 0
        }
      ],
      now,
      report,
      tags: [
        {
          id: 100,
          userId: 1,
          name: 'Work',
          lastUse: '2020-01-02 12:00:00',
          sort: 0,
          show: 1
        },
        {
          id: 101,
          userId: 1,
          name: 'Work',
          lastUse: '2020-01-02 13:00:00',
          sort: 1,
          show: 1
        },
        {
          id: 102,
          userId: 2,
          name: '',
          lastUse: null,
          sort: null,
          show: null
        }
      ],
      users: [
        {
          id: 1,
          username: 'demo',
          password: md5('demo'),
          email: 'demo@example.com',
          createdAt: '2020-01-01 12:00:00',
          lastLogin: '2020-01-01 13:00:00',
          searchHistory: null,
          avatar: null,
          quickUrl: null
        },
        {
          id: 2,
          username: 'legacy-bad',
          password: 'not-md5',
          email: 'legacy@example.com',
          createdAt: null,
          lastLogin: null,
          searchHistory: '',
          avatar: '',
          quickUrl: ''
        }
      ]
    });

    expect(result.users).toHaveLength(2);
    expect(result.users[0]).toMatchObject({
      id: 1,
      username: 'demo',
      passwordAlgo: 'md5_legacy',
      passwordHash: md5('demo'),
      searchHistory: '[]'
    });
    expect(result.users[1].passwordAlgo).toBe('scrypt');
    expect(result.users[1].passwordHash).not.toBe('legacy-bad');
    expect(result.users[1].quickUrl).toBe('{"B":"https://www.baidu.com/","G":"https://www.google.com.hk/","H":"https://github.com/"}');

    expect(result.tags.map((tag) => tag.id)).toEqual([100, 102, 103]);
    expect(result.tags[1]).toMatchObject({
      id: 102,
      name: '未分类',
      sort: 0,
      show: 1
    });
    expect(result.tags[2]).toMatchObject({
      id: 103,
      userId: 1,
      name: '未分类',
      sort: 0,
      show: 1
    });

    expect(result.bookmarks.map((bookmark) => bookmark.id)).toEqual([200, 201, 202]);
    expect(result.bookmarks[0].title).toBe('https://example.com/');
    expect(result.bookmarks[1].url).toBe('javascript:alert(1)');
    expect(result.bookmarks[2].tagId).toBe(103);
    expect(result.advices.map((advice) => advice.id)).toEqual([300]);
    expect(result.notes.map((note) => note.id)).toEqual([400, 403]);
    expect(result.notes[1].tagId).toBe(103);

    expect(report.passwordResets).toEqual(['legacy-bad']);
    expect(report.duplicates.tags).toBe(1);
    expect(report.skipped.bookmarks).toBe(0);
    expect(report.skipped.advices).toBe(1);
    expect(report.skipped.notes).toBe(2);
    expect(report.imported.tags).toBe(3);
    expect(report.invalidBookmarks).toEqual([
      expect.objectContaining({
        id: 201,
        reason: 'invalid_url'
      })
    ]);
    expect(report.orphanRows).toEqual([
      expect.objectContaining({
        table: 'advices',
        id: 301
      }),
      expect.objectContaining({
        table: 'notes',
        id: 401
      })
    ]);
    expect(report.invalidNotes).toEqual([
      expect.objectContaining({
        id: 402,
        reason: 'missing_content'
      })
    ]);
  });

  it('imports normalized rows into sqlite with preserved ids', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'bookmark-migration-test-'));
    const databasePath = join(tempDir, 'migration.db');
    const databaseUrl = `file:${databasePath}`;

    execFileSync('npx', ['prisma', 'db', 'push', '--force-reset', '--url', databaseUrl], {
      cwd: join(import.meta.dirname, '..'),
      stdio: 'ignore'
    });

    const prisma = createPrismaClient(databaseUrl);

    try {
      const normalized = await normalizeLegacyRows({
        advices: [
          {
            id: 30,
            userId: 10,
            comment: 'advice',
            createdAt: '2020-01-04 00:00:00',
            state: 0
          }
        ],
        bookmarks: [
          {
            id: 20,
            userId: 10,
            tagId: 11,
            title: 'Example',
            description: 'bookmark',
            url: 'https://example.com/',
            public: 1,
            clickCount: 9,
            createdAt: '2020-01-02 00:00:00',
            lastClick: '2020-01-03 00:00:00'
          }
        ],
        notes: [
          {
            id: 40,
            userId: 10,
            tagId: 11,
            content: 'note',
            createdAt: '2020-01-05 00:00:00',
            public: 1
          }
        ],
        tags: [
          {
            id: 11,
            userId: 10,
            name: 'Work',
            lastUse: '2020-01-02 00:00:00',
            sort: 0,
            show: 1
          }
        ],
        users: [
          {
            id: 10,
            username: 'legacy-user',
            password: md5('secret'),
            email: 'legacy-user@example.com',
            createdAt: '2020-01-01 00:00:00',
            lastLogin: '2020-01-01 01:00:00',
            searchHistory: null,
            avatar: null,
            quickUrl: null
          }
        ]
      });

      await importNormalizedRows(prisma, normalized);

      expect(await prisma.user.count()).toBe(1);
      expect(await prisma.tag.count()).toBe(1);
      expect(await prisma.bookmark.count()).toBe(1);
      expect(await prisma.advice.count()).toBe(1);
      expect(await prisma.note.count()).toBe(1);

      const user = await prisma.user.findUnique({
        where: {
          id: 10
        }
      });
      const bookmark = await prisma.bookmark.findUnique({
        where: {
          id: 20
        }
      });

      expect(user?.passwordAlgo).toBe('md5_legacy');
      expect(bookmark).toMatchObject({
        id: 20,
        userId: 10,
        tagId: 11
      });
    } finally {
      await prisma.$disconnect();
      rmSync(tempDir, { force: true, recursive: true });
    }
  });
});
