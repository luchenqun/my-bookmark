export interface ImportedBookmark {
  title: string;
  url: string;
  tagName: string;
  clickCount: number;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function parseBookmarkHtml(html: string): ImportedBookmark[] {
  const tokenPattern = /<DL><p>|<\/DL><p>|<H3[^>]*>(.*?)<\/H3>|<A([^>]*)>(.*?)<\/A>/gims;
  const stack: string[] = [];
  let pendingFolder: string | null = null;
  const bookmarks: ImportedBookmark[] = [];

  for (const match of html.matchAll(tokenPattern)) {
    const [token, h3Text, anchorAttrs, anchorText] = match;

    if (token.toUpperCase() === '<DL><P>') {
      if (pendingFolder) {
        stack.push(decodeHtml(pendingFolder.trim()));
        pendingFolder = null;
      }
      continue;
    }

    if (token.toUpperCase() === '</DL><P>') {
      stack.pop();
      continue;
    }

    if (typeof h3Text === 'string') {
      pendingFolder = h3Text;
      continue;
    }

    if (typeof anchorAttrs === 'string' && typeof anchorText === 'string') {
      const href = anchorAttrs.match(/HREF="([^"]+)"/i)?.[1]?.trim();
      if (!href) {
        continue;
      }

      const clickCount = Number(anchorAttrs.match(/CLICK_COUNT="([^"]+)"/i)?.[1] || 1);
      const deepestTag = stack.at(-1) || pendingFolder || '未分类';
      const tagName = stack.length > 1 ? stack.at(-1)! : deepestTag;

      bookmarks.push({
        title: decodeHtml(anchorText.trim()) || href,
        url: decodeHtml(href),
        tagName: decodeHtml(tagName.trim()),
        clickCount: Number.isFinite(clickCount) && clickCount > 0 ? clickCount : 1
      });
    }
  }

  return bookmarks;
}
