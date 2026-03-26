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

  it('uses the local favicon proxy instead of the retired external service', () => {
    const searchView = readFileSync(join(import.meta.dirname, '../public/views/search.html'), 'utf8');
    const tagsView = readFileSync(join(import.meta.dirname, '../public/views/tags.html'), 'utf8');
    const settingsView = readFileSync(join(import.meta.dirname, '../public/views/settings.html'), 'utf8');
    const bookmarkInfoController = readFileSync(join(import.meta.dirname, '../public/scripts/controllers/bookmark-info-controller.js'), 'utf8');

    expect(searchView).not.toContain('https://favicon.lucq.fun');
    expect(tagsView).not.toContain('https://favicon.lucq.fun');
    expect(settingsView).not.toContain('https://favicon.lucq.fun');
    expect(bookmarkInfoController).not.toContain('https://favicon.lucq.fun');

    expect(searchView).toContain('/favicon?url=');
    expect(tagsView).toContain('/favicon?url=');
    expect(settingsView).toContain('/favicon?url=');
    expect(bookmarkInfoController).toContain('/favicon?url=');
  });
});
