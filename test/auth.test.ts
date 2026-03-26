import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
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

  it('accepts the legacy trailing-slash login route used by the extension', async () => {
    const response = await context.app.inject({
      method: 'POST',
      url: '/api/userLogin/',
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

  it('accepts the legacy trailing-slash tags route used by the extension', async () => {
    const loginResponse = await context.app.inject({
      method: 'POST',
      url: '/api/userLogin',
      payload: {
        username: 'demo',
        password: 'demo'
      }
    });

    const token = loginResponse.json().data.token as string;

    const response = await context.app.inject({
      method: 'GET',
      url: '/api/tags/',
      headers: {
        authorization: token
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().code).toBe(0);
    expect(response.json().data.length).toBeGreaterThan(0);
  });

  it('does not allow the strict test account to reset its password', async () => {
    const registerResponse = await context.app.inject({
      method: 'POST',
      url: '/api/userRegister',
      payload: {
        username: 'test',
        password: 'test',
        email: 'test@example.com'
      }
    });

    expect(registerResponse.statusCode).toBe(200);
    expect(registerResponse.json().code).toBe(0);

    const loginResponse = await context.app.inject({
      method: 'POST',
      url: '/api/userLogin',
      payload: {
        username: 'test',
        password: 'test'
      }
    });

    const token = loginResponse.json().data.token as string;

    const resetResponse = await context.app.inject({
      method: 'POST',
      url: '/api/userResetPwd',
      headers: {
        authorization: token
      },
      payload: {
        old: 'test',
        password: 'changed-password'
      }
    });

    expect(resetResponse.statusCode).toBe(200);
    expect(resetResponse.json()).toEqual({
      code: 0,
      data: 0,
      msg: 'test账号不允许修改密码!'
    });

    const oldPasswordLoginResponse = await context.app.inject({
      method: 'POST',
      url: '/api/userLogin',
      payload: {
        username: 'test',
        password: 'test'
      }
    });

    const newPasswordLoginResponse = await context.app.inject({
      method: 'POST',
      url: '/api/userLogin',
      payload: {
        username: 'test',
        password: 'changed-password'
      }
    });

    expect(oldPasswordLoginResponse.json().code).toBe(0);
    expect(newPasswordLoginResponse.json().code).toBe(2);
  });

  it('registers a user against a brand new sqlite database file', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'bookmark-empty-db-'));
    const databaseUrl = `file:${join(tempDir, 'app.db')}`;
    const app = await buildApp({
      databaseUrl,
      jwtSecret: 'test-secret',
      logger: false
    });

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/userRegister',
        payload: {
          username: 'fresh-user',
          password: 'fresh-pass',
          email: 'fresh@example.com'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        code: 0,
        data: expect.any(Number),
        msg: '注册成功'
      });
    } finally {
      await app.close();
      rmSync(tempDir, { force: true, recursive: true });
    }
  });
});
