import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { hashPassword } from '../src/lib/password.js';

const DEFAULT_QUICK_URL = JSON.stringify({
  B: 'https://www.baidu.com/',
  G: 'https://www.google.com.hk/',
  H: 'https://github.com/'
});

export async function seedDemoData(prisma: PrismaClient) {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return;
  }

  const now = new Date();
  const demoPassword = await hashPassword('demo');
  const samplePassword = await hashPassword('sample');

  const demo = await prisma.user.create({
    data: {
      username: 'demo',
      passwordHash: demoPassword,
      passwordAlgo: 'scrypt',
      email: 'demo@example.com',
      createdAt: now,
      lastLogin: now,
      searchHistory: '[]',
      quickUrl: DEFAULT_QUICK_URL
    }
  });

  const sample = await prisma.user.create({
    data: {
      username: 'sample',
      passwordHash: samplePassword,
      passwordAlgo: 'scrypt',
      email: 'sample@example.com',
      createdAt: now,
      lastLogin: now,
      searchHistory: '[]',
      quickUrl: DEFAULT_QUICK_URL
    }
  });

  const demoDefaultTag = await prisma.tag.create({
    data: {
      userId: demo.id,
      name: '未分类',
      sort: 0,
      show: 1,
      lastUse: now
    }
  });

  const demoWorkTag = await prisma.tag.create({
    data: {
      userId: demo.id,
      name: '开发',
      sort: 1,
      show: 1,
      lastUse: now
    }
  });

  const sampleDefaultTag = await prisma.tag.create({
    data: {
      userId: sample.id,
      name: '未分类',
      sort: 0,
      show: 1,
      lastUse: now
    }
  });

  await prisma.bookmark.createMany({
    data: [
      {
        userId: demo.id,
        tagId: demoDefaultTag.id,
        title: 'Fastify',
        url: 'https://fastify.dev/',
        description: 'Fastify official website',
        public: 1,
        clickCount: 3,
        createdAt: now,
        lastClick: now
      },
      {
        userId: demo.id,
        tagId: demoWorkTag.id,
        title: 'Prisma',
        url: 'https://www.prisma.io/',
        description: 'Prisma official website',
        public: 0,
        clickCount: 2,
        createdAt: now,
        lastClick: now
      },
      {
        userId: sample.id,
        tagId: sampleDefaultTag.id,
        title: 'TypeScript',
        url: 'https://www.typescriptlang.org/',
        description: 'TypeScript official website',
        public: 1,
        clickCount: 1,
        createdAt: now,
        lastClick: now
      }
    ]
  });

  await prisma.note.createMany({
    data: [
      {
        userId: demo.id,
        tagId: demoDefaultTag.id,
        content: 'demo note',
        public: 1,
        createdAt: now
      },
      {
        userId: sample.id,
        tagId: sampleDefaultTag.id,
        content: 'sample note',
        public: 0,
        createdAt: now
      }
    ]
  });

  await prisma.advice.create({
    data: {
      userId: demo.id,
      comment: 'demo advice',
      createdAt: now,
      state: 0
    }
  });
}

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL || 'file:./data/app.db') {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: databaseUrl
    })
  });
}

async function main() {
  const prisma = createPrismaClient();

  try {
    await seedDemoData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
