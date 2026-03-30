import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildTestApp } from './helpers.js';

let context: Awaited<ReturnType<typeof buildTestApp>>;

async function loginDemo() {
  const response = await context.app.inject({
    method: 'POST',
    url: '/api/userLogin',
    payload: {
      username: 'demo',
      password: 'demo'
    }
  });

  const body = response.json();
  return body.data.token as string;
}

describe('main api compatibility', () => {
  beforeEach(async () => {
    context = await buildTestApp();
  });

  afterEach(async () => {
    await context.app.close();
    context.cleanup();
  });

  it('returns current user and tags for an authenticated request', async () => {
    const token = await loginDemo();

    const userResponse = await context.app.inject({
      method: 'GET',
      url: '/api/user?full=true',
      headers: {
        authorization: token
      }
    });

    const tagsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/tags',
      headers: {
        authorization: token
      }
    });

    expect(userResponse.statusCode).toBe(200);
    expect(userResponse.json().data.username).toBe('demo');
    expect(tagsResponse.statusCode).toBe(200);
    expect(tagsResponse.json().data.length).toBeGreaterThan(0);
  });

  it('adds and queries bookmarks in old api shape', async () => {
    const token = await loginDemo();
    const tagsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/tags',
      headers: {
        authorization: token
      }
    });
    const tagId = tagsResponse.json().data[0].id as number;

    const addResponse = await context.app.inject({
      method: 'POST',
      url: '/api/bookmarkAdd',
      headers: {
        authorization: token
      },
      payload: {
        tagId,
        title: 'Example',
        url: 'https://example.com/',
        description: 'example bookmark'
      }
    });

    const bookmarkId = addResponse.json().data as number;
    const bookmarkResponse = await context.app.inject({
      method: 'GET',
      url: `/api/bookmark?id=${bookmarkId}`,
      headers: {
        authorization: token
      }
    });

    const byTagResponse = await context.app.inject({
      method: 'GET',
      url: `/api/bookmarksByTag?tagId=${tagId}&page=1&pageSize=20&showType=createdAt`,
      headers: {
        authorization: token
      }
    });

    const searchResponse = await context.app.inject({
      method: 'GET',
      url: '/api/bookmarksSearch?keyword=Example&range=self&page=1&pageSize=20',
      headers: {
        authorization: token
      }
    });

    expect(addResponse.statusCode).toBe(200);
    expect(typeof bookmarkId).toBe('number');
    expect(bookmarkResponse.json().data.title).toBe('Example');
    expect(byTagResponse.json().data.data.some((item: { id: number }) => item.id === bookmarkId)).toBe(true);
    expect(searchResponse.json().data.data.some((item: { id: number }) => item.id === bookmarkId)).toBe(true);
  });

  it('adds notes and advice in old api shape', async () => {
    const token = await loginDemo();
    const tagsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/tags',
      headers: {
        authorization: token
      }
    });
    const tagId = tagsResponse.json().data[0].id as number;

    const noteAddResponse = await context.app.inject({
      method: 'POST',
      url: '/api/noteAdd',
      headers: {
        authorization: token
      },
      payload: {
        tagId,
        content: 'new test note',
        public: 1
      }
    });

    const notesResponse = await context.app.inject({
      method: 'GET',
      url: `/api/notes?tagId=${tagId}&page=1&pageSize=20`,
      headers: {
        authorization: token
      }
    });

    const adviceAddResponse = await context.app.inject({
      method: 'POST',
      url: '/api/adviceAdd',
      headers: {
        authorization: token
      },
      payload: {
        comment: 'new advice'
      }
    });

    const advicesResponse = await context.app.inject({
      method: 'GET',
      url: '/api/advices',
      headers: {
        authorization: token
      }
    });

    expect(noteAddResponse.statusCode).toBe(200);
    expect(notesResponse.json().data.data.some((item: { content: string }) => item.content === 'new test note')).toBe(true);
    expect(adviceAddResponse.json().code).toBe(0);
    expect(advicesResponse.json().data.some((item: { comment: string }) => item.comment === 'new advice')).toBe(true);
  });

  it('shares a note after noteUpdate receives string public values', async () => {
    const token = await loginDemo();
    const tagsResponse = await context.app.inject({
      method: 'GET',
      url: '/api/tags',
      headers: {
        authorization: token
      }
    });
    const tagId = tagsResponse.json().data[0].id as number;

    const noteAddResponse = await context.app.inject({
      method: 'POST',
      url: '/api/noteAdd',
      headers: {
        authorization: token
      },
      payload: {
        tagId,
        content: 'shared note content',
        public: 0
      }
    });

    const noteId = noteAddResponse.json().data as number;

    const noteUpdateResponse = await context.app.inject({
      method: 'POST',
      url: '/api/noteUpdate',
      headers: {
        authorization: token
      },
      payload: {
        id: noteId,
        public: '1'
      }
    });

    const noteShareResponse = await context.app.inject({
      method: 'GET',
      url: `/api/noteShare?id=${noteId}`
    });

    expect(noteUpdateResponse.json().code).toBe(0);
    expect(noteShareResponse.statusCode).toBe(200);
    expect(noteShareResponse.body).toContain('shared note content');
  });
});
