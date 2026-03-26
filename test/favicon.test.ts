import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../src/app.js';

const defaultFavicon = readFileSync(join(import.meta.dirname, '../public/images/default.ico'));

describe('favicon proxy', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('proxies favicon responses from the upstream service', async () => {
    const upstreamBody = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const fetchMock = vi.fn(async (_input: string | URL | Request) => {
      return new Response(upstreamBody, {
        status: 200,
        headers: {
          'content-type': 'image/png'
        }
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/favicon?url=https://qclaw.qq.com&size=32'
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('image/png');
    expect(response.rawPayload).toEqual(upstreamBody);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestArg = fetchMock.mock.calls[0]?.[0];
    expect(requestArg).toBeDefined();

    const requestUrl = new URL(String(requestArg));
    expect(requestUrl.origin).toBe('https://t2.gstatic.com');
    expect(requestUrl.pathname).toBe('/faviconV2');
    expect(requestUrl.searchParams.get('client')).toBe('SOCIAL');
    expect(requestUrl.searchParams.get('type')).toBe('FAVICON');
    expect(requestUrl.searchParams.get('size')).toBe('32');
    expect(requestUrl.searchParams.get('url')).toBe('https://qclaw.qq.com/');

    await app.close();
  });

  it('falls back to the local default icon when the upstream request fails', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('upstream failed', {
        status: 502
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/favicon?url=https://example.com'
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('image/x-icon');
    expect(response.rawPayload).toEqual(defaultFavicon);

    await app.close();
  });

  it('falls back to the local default icon for invalid urls without calling upstream', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/favicon?url=not-a-valid-url'
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('image/x-icon');
    expect(response.rawPayload).toEqual(defaultFavicon);
    expect(fetchMock).not.toHaveBeenCalled();

    await app.close();
  });
});
