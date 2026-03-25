import { describe, expect, it } from 'vitest';

import { parseBookmarkHtml } from '../src/lib/bookmark-html.js';

describe('bookmark html parser', () => {
  it('extracts bookmarks and folder names from netscape bookmark export', () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><H3>Bookmarks Bar</H3>
  <DL><p>
    <DT><H3>Work</H3>
    <DL><p>
      <DT><A HREF="https://fastify.dev/" ADD_DATE="1710000000" LAST_CLICK="1710003600" CLICK_COUNT="2">Fastify</A>
    </DL><p>
  </DL><p>
</DL><p>`;

    const items = parseBookmarkHtml(html);

    expect(items).toEqual([
      {
        title: 'Fastify',
        url: 'https://fastify.dev/',
        tagName: 'Work',
        clickCount: 2
      }
    ]);
  });
});
