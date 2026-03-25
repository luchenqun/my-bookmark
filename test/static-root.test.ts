import { describe, expect, it } from 'vitest';

import { resolveStaticRoot } from '../src/lib/static-root.js';

describe('static root resolution', () => {
  it('resolves the public directory from the project cwd', () => {
    expect(resolveStaticRoot('/Users/luke/Code/bookmark/bookmark')).toBe('/Users/luke/Code/bookmark/bookmark/public');
  });
});
