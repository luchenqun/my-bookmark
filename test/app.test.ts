import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('app', () => {
  it('serves health endpoint', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

    await app.close();
  });

  it('serves legacy frontend index page from root', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('ng-app="bookmarkApp"');

    await app.close();
  });

  it('serves static assets from bookmark public directory', () => {
    const source = readFileSync(join(import.meta.dirname, '../src/plugins/static.ts'), 'utf8');

    expect(source).toContain('resolveStaticRoot');
    expect(source).not.toContain('../../../my-bookmark/view');
  });
});
