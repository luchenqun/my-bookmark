import { describe, expect, it } from 'vitest';

import { formatStartupUrls, resolvePort } from '../src/lib/startup.js';

describe('startup logging', () => {
  it('defaults app port to 8157 when PORT is absent', () => {
    expect(resolvePort({})).toBe(8157);
  });

  it('formats local and network urls for startup output', () => {
    expect(formatStartupUrls(3000, 'http://0.0.0.0:3000')).toEqual(['Local: http://localhost:3000', 'Network: http://0.0.0.0:3000']);
  });
});
