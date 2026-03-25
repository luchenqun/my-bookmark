import { describe, expect, it } from 'vitest';

import { loadMigrationConfig } from '../scripts/migration-helpers.js';

describe('migration config', () => {
  it('defaults sqlite target to DATABASE_URL when migration override is absent', () => {
    const config = loadMigrationConfig({
      DATABASE_URL: 'file:./data/app.db',
      MYSQL_PASSWORD: '123456'
    });

    expect(config.sqliteUrl).toBe('file:./data/app.db');
  });

  it('defaults mysql database to mybookmarks', () => {
    const config = loadMigrationConfig({
      MYSQL_PASSWORD: '123456'
    });

    expect(config.mysqlDatabase).toBe('mybookmarks');
  });
});
