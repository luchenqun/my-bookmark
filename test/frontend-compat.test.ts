import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('frontend compatibility', () => {
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
