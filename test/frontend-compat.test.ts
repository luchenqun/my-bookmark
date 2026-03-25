import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('frontend hot cleanup', () => {
  it('does not expose hot in login menus', () => {
    const source = readFileSync(join(import.meta.dirname, '../public/scripts/services/data-service.js'), 'utf8');

    expect(source).not.toContain("uiSref: 'hot'");
  });

  it('does not expose hot search range', () => {
    const source = readFileSync(join(import.meta.dirname, '../public/views/search.html'), 'utf8');

    expect(source).not.toContain('data-value="hot"');
    expect(source).not.toContain('热门收藏');
  });
});
