import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts'
  },
  datasource: {
    url: process.env.DATABASE_URL || 'file:./data/app.db'
  }
});
