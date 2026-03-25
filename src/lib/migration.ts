import type { PrismaClient } from '@prisma/client';

import { hashPassword, isLegacyMd5 } from './password.js';

export const DEFAULT_QUICK_URL = JSON.stringify({
  B: 'https://www.baidu.com/',
  G: 'https://www.google.com.hk/',
  H: 'https://github.com/'
});

type LegacyDateValue = Date | string | null | undefined;

export interface LegacyUserRow {
  id: number;
  username: string;
  password: string;
  email: string;
  createdAt: LegacyDateValue;
  lastLogin: LegacyDateValue;
  searchHistory: string | null;
  avatar: string | null;
  quickUrl: string | null;
}

export interface LegacyTagRow {
  id: number;
  userId: number;
  name: string | null;
  lastUse: LegacyDateValue;
  sort: number | null;
  show: number | null;
}

export interface LegacyBookmarkRow {
  id: number;
  userId: number;
  tagId: number;
  title: string | null;
  description: string | null;
  url: string | null;
  public: number | null;
  clickCount: number | null;
  createdAt: LegacyDateValue;
  lastClick: LegacyDateValue;
}

export interface LegacyAdviceRow {
  id: number;
  userId: number;
  comment: string;
  createdAt: LegacyDateValue;
  state: number | null;
}

export interface LegacyNoteRow {
  id: number;
  userId: number;
  tagId: number;
  content: string | null;
  createdAt: LegacyDateValue;
  public: number | null;
}

export interface NormalizedUserRow {
  id: number;
  username: string;
  passwordHash: string;
  passwordAlgo: string;
  email: string;
  createdAt: Date;
  lastLogin: Date;
  searchHistory: string;
  avatar: string | null;
  quickUrl: string;
}

export interface NormalizedTagRow {
  id: number;
  userId: number;
  name: string;
  lastUse: Date;
  sort: number;
  show: number;
}

export interface NormalizedBookmarkRow {
  id: number;
  userId: number;
  tagId: number;
  title: string;
  description: string | null;
  url: string;
  public: number;
  clickCount: number;
  createdAt: Date;
  lastClick: Date;
}

export interface NormalizedAdviceRow {
  id: number;
  userId: number;
  comment: string;
  createdAt: Date;
  state: number;
}

export interface NormalizedNoteRow {
  id: number;
  userId: number;
  tagId: number;
  content: string;
  createdAt: Date;
  public: number;
}

export interface MigrationReport {
  duplicates: {
    tags: number;
  };
  imported: {
    advices: number;
    bookmarks: number;
    notes: number;
    tags: number;
    users: number;
  };
  invalidBookmarks: Array<{
    id: number;
    reason: 'invalid_url' | 'missing_user';
    title: string | null;
    userId: number;
    url: string | null;
  }>;
  invalidNotes: Array<{
    id: number;
    reason: 'missing_content';
  }>;
  orphanRows: Array<{
    id: number;
    reason: 'missing_user' | 'missing_tag';
    table: 'advices' | 'notes';
  }>;
  passwordResets: string[];
  skipped: {
    advices: number;
    bookmarks: number;
    notes: number;
    tags: number;
    users: number;
  };
}

export interface NormalizeLegacyRowsInput {
  advices: LegacyAdviceRow[];
  bookmarks: LegacyBookmarkRow[];
  notes: LegacyNoteRow[];
  now?: Date;
  report?: MigrationReport;
  tags: LegacyTagRow[];
  users: LegacyUserRow[];
}

export interface NormalizedLegacyRows {
  advices: NormalizedAdviceRow[];
  bookmarks: NormalizedBookmarkRow[];
  notes: NormalizedNoteRow[];
  report: MigrationReport;
  tags: NormalizedTagRow[];
  users: NormalizedUserRow[];
}

export interface ImportNormalizedRowsOptions {
  batchSize?: number;
  reset?: boolean;
}

async function insertInChunks<T>(items: T[], batchSize: number, insertChunk: (chunk: T[]) => Promise<void>) {
  for (let index = 0; index < items.length; index += batchSize) {
    await insertChunk(items.slice(index, index + batchSize));
  }
}

export function buildDefaultMigrationReport(): MigrationReport {
  return {
    duplicates: {
      tags: 0
    },
    imported: {
      advices: 0,
      bookmarks: 0,
      notes: 0,
      tags: 0,
      users: 0
    },
    invalidBookmarks: [],
    invalidNotes: [],
    orphanRows: [],
    passwordResets: [],
    skipped: {
      advices: 0,
      bookmarks: 0,
      notes: 0,
      tags: 0,
      users: 0
    }
  };
}

function parseLegacyDate(value: LegacyDateValue, fallback: Date): Date {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value.replace(' ', 'T'));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeSearchHistory(value: string | null | undefined): string {
  return value && value.trim() ? value : '[]';
}

function normalizeQuickUrl(value: string | null | undefined): string {
  return value && value.trim() ? value : DEFAULT_QUICK_URL;
}

function normalizeTagName(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : '未分类';
}

function isValidBookmarkUrl(value: string | null | undefined): value is string {
  if (!value || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeBookmarkTitle(title: string | null | undefined, url: string) {
  return title && title.trim() ? title.trim() : url;
}

function normalizeBookmarkUrl(url: string | null | undefined) {
  return url?.trim() ?? '';
}

export async function normalizeLegacyRows(input: NormalizeLegacyRowsInput): Promise<NormalizedLegacyRows> {
  const now = input.now ?? new Date();
  const report = input.report ?? buildDefaultMigrationReport();

  const users: NormalizedUserRow[] = [];

  for (const user of input.users) {
    const legacyHash = user.password?.trim() ?? '';
    const shouldKeepLegacy = isLegacyMd5(legacyHash);
    const passwordHash = shouldKeepLegacy ? legacyHash : await hashPassword(user.username);

    if (!shouldKeepLegacy) {
      report.passwordResets.push(user.username);
    }

    users.push({
      id: user.id,
      username: user.username,
      passwordHash,
      passwordAlgo: shouldKeepLegacy ? 'md5_legacy' : 'scrypt',
      email: user.email,
      createdAt: parseLegacyDate(user.createdAt, now),
      lastLogin: parseLegacyDate(user.lastLogin, now),
      searchHistory: normalizeSearchHistory(user.searchHistory),
      avatar: user.avatar && user.avatar.trim() ? user.avatar : null,
      quickUrl: normalizeQuickUrl(user.quickUrl)
    });
  }

  const userIds = new Set(users.map((user) => user.id));
  report.imported.users = users.length;

  const tags: NormalizedTagRow[] = [];
  const tagIds = new Set<number>();
  const uniqueTagKeys = new Set<string>();
  const defaultTagIdsByUser = new Map<number, number>();
  let nextTagId = input.tags.reduce((maxId, tag) => Math.max(maxId, tag.id), 0) + 1;

  for (const tag of input.tags) {
    if (!userIds.has(tag.userId)) {
      report.skipped.tags += 1;
      continue;
    }

    const name = normalizeTagName(tag.name);
    const uniqueKey = `${tag.userId}:${name}`;

    if (uniqueTagKeys.has(uniqueKey)) {
      report.duplicates.tags += 1;
      report.skipped.tags += 1;
      continue;
    }

    uniqueTagKeys.add(uniqueKey);
    tagIds.add(tag.id);
    if (name === '未分类') {
      defaultTagIdsByUser.set(tag.userId, tag.id);
    }
    tags.push({
      id: tag.id,
      userId: tag.userId,
      name,
      lastUse: parseLegacyDate(tag.lastUse, now),
      sort: tag.sort ?? 0,
      show: tag.show ?? 1
    });
  }

  function ensureDefaultTag(userId: number) {
    const existingId = defaultTagIdsByUser.get(userId);
    if (existingId) {
      return existingId;
    }

    const createdId = nextTagId;
    nextTagId += 1;
    defaultTagIdsByUser.set(userId, createdId);
    tagIds.add(createdId);
    uniqueTagKeys.add(`${userId}:未分类`);
    tags.push({
      id: createdId,
      userId,
      name: '未分类',
      lastUse: now,
      sort: 0,
      show: 1
    });

    return createdId;
  }

  const bookmarks: NormalizedBookmarkRow[] = [];

  for (const bookmark of input.bookmarks) {
    if (!userIds.has(bookmark.userId)) {
      report.skipped.bookmarks += 1;
      report.invalidBookmarks.push({
        id: bookmark.id,
        reason: 'missing_user',
        title: bookmark.title,
        userId: bookmark.userId,
        url: bookmark.url
      });
      continue;
    }

    const url = normalizeBookmarkUrl(bookmark.url);
    const tagId = tagIds.has(bookmark.tagId) ? bookmark.tagId : ensureDefaultTag(bookmark.userId);

    if (!isValidBookmarkUrl(url)) {
      report.invalidBookmarks.push({
        id: bookmark.id,
        reason: 'invalid_url',
        title: bookmark.title,
        userId: bookmark.userId,
        url
      });
    }

    bookmarks.push({
      id: bookmark.id,
      userId: bookmark.userId,
      tagId,
      title: normalizeBookmarkTitle(bookmark.title, url),
      description: bookmark.description,
      url,
      public: bookmark.public ?? 0,
      clickCount: bookmark.clickCount ?? 1,
      createdAt: parseLegacyDate(bookmark.createdAt, now),
      lastClick: parseLegacyDate(bookmark.lastClick, now)
    });
  }

  report.imported.bookmarks = bookmarks.length;

  const advices: NormalizedAdviceRow[] = [];

  for (const advice of input.advices) {
    if (!userIds.has(advice.userId)) {
      report.skipped.advices += 1;
      report.orphanRows.push({
        table: 'advices',
        id: advice.id,
        reason: 'missing_user'
      });
      continue;
    }

    advices.push({
      id: advice.id,
      userId: advice.userId,
      comment: advice.comment,
      createdAt: parseLegacyDate(advice.createdAt, now),
      state: advice.state ?? 0
    });
  }

  report.imported.advices = advices.length;

  const notes: NormalizedNoteRow[] = [];

  for (const note of input.notes) {
    if (!userIds.has(note.userId)) {
      report.skipped.notes += 1;
      report.orphanRows.push({
        table: 'notes',
        id: note.id,
        reason: 'missing_user'
      });
      continue;
    }

    if (!note.content || !note.content.trim()) {
      report.skipped.notes += 1;
      report.invalidNotes.push({
        id: note.id,
        reason: 'missing_content'
      });
      continue;
    }

    notes.push({
      id: note.id,
      userId: note.userId,
      tagId: tagIds.has(note.tagId) ? note.tagId : ensureDefaultTag(note.userId),
      content: note.content,
      createdAt: parseLegacyDate(note.createdAt, now),
      public: note.public ?? 0
    });
  }

  report.imported.tags = tags.length;
  report.imported.notes = notes.length;

  return {
    users,
    tags,
    bookmarks,
    advices,
    notes,
    report
  };
}

export async function importNormalizedRows(prisma: PrismaClient, rows: NormalizedLegacyRows, options: ImportNormalizedRowsOptions = {}) {
  const batchSize = options.batchSize ?? 1000;

  await prisma.$transaction(async (tx) => {
    if (options.reset !== false) {
      await tx.note.deleteMany();
      await tx.advice.deleteMany();
      await tx.bookmark.deleteMany();
      await tx.tag.deleteMany();
      await tx.user.deleteMany();
    }

    if (rows.users.length > 0) {
      await insertInChunks(rows.users, batchSize, async (chunk) => {
        await tx.user.createMany({
          data: chunk
        });
      });
    }

    if (rows.tags.length > 0) {
      await insertInChunks(rows.tags, batchSize, async (chunk) => {
        await tx.tag.createMany({
          data: chunk
        });
      });
    }

    if (rows.bookmarks.length > 0) {
      await insertInChunks(rows.bookmarks, batchSize, async (chunk) => {
        await tx.bookmark.createMany({
          data: chunk
        });
      });
    }

    if (rows.advices.length > 0) {
      await insertInChunks(rows.advices, batchSize, async (chunk) => {
        await tx.advice.createMany({
          data: chunk
        });
      });
    }

    if (rows.notes.length > 0) {
      await insertInChunks(rows.notes, batchSize, async (chunk) => {
        await tx.note.createMany({
          data: chunk
        });
      });
    }
  });

  return {
    advices: rows.advices.length,
    bookmarks: rows.bookmarks.length,
    notes: rows.notes.length,
    tags: rows.tags.length,
    users: rows.users.length
  };
}
