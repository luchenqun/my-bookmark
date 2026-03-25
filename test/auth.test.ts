import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildTestApp } from './helpers.js';

let context: Awaited<ReturnType<typeof buildTestApp>>;

describe('auth api', () => {
  beforeEach(async () => {
    context = await buildTestApp();
  });

  afterEach(async () => {
    if (context) {
      await context.app.close();
      context.cleanup();
    }
  });

  it('logs in with seeded demo account', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/api/userLogin',
      payload: {
        username: 'demo',
        password: 'demo'
      }
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.code).toBe(0);
    expect(body.data.username).toBe('demo');
    expect(typeof body.data.token).toBe('string');
  });

  it('rejects protected api without authorization token', async () => {
    const response = await context.app.inject({
      method: 'GET',
      url: '/api/tags'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe(401);
  });
});
