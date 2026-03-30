import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import type { Advice, Bookmark, Note, Tag, User } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

import { fail, ok } from '../lib/reply.js';
import { parseBookmarkHtml } from '../lib/bookmark-html.js';
import { hashPassword, md5, verifyPassword } from '../lib/password.js';

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return '';
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');
  const second = String(value.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  return new Date(value.replace(' ', 'T'));
}

function parseRange(range?: string) {
  if (!range) {
    return null;
  }

  const [start, end] = range.split(',');
  const startAt = parseDate(start);
  const endAt = parseDate(end);

  if (!startAt || !endAt) {
    return null;
  }

  return {
    gte: startAt,
    lte: endAt
  };
}

function toPagination(pageValue?: string | number, pageSizeValue?: string | number) {
  const currentPage = Math.max(Number(pageValue || 1), 1);
  const pageSize = Math.max(Number(pageSizeValue || 20), 1);

  return {
    currentPage,
    pageSize,
    skip: (currentPage - 1) * pageSize
  };
}

function toCountSelect<T>(rows: T[], count: number, currentPage: number, pageSize: number) {
  return {
    count,
    totalPages: count === 0 ? 0 : Math.ceil(count / pageSize),
    pageSize,
    currentPage,
    data: rows
  };
}

function serializeUser(user: User, token?: string) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: formatDate(user.createdAt),
    lastLogin: formatDate(user.lastLogin),
    searchHistory: user.searchHistory,
    avatar: user.avatar,
    quickUrl: user.quickUrl,
    ...(token ? { token } : {})
  };
}

function serializeTag(tag: Tag, bookmarkCount = 0, noteCount = 0) {
  return {
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    lastUse: formatDate(tag.lastUse),
    sort: tag.sort,
    show: tag.show,
    bookmarkCount,
    noteCount
  };
}

function serializeBookmark(bookmark: Bookmark & { tag?: Tag | null }, tagName?: string) {
  return {
    id: bookmark.id,
    userId: bookmark.userId,
    tagId: bookmark.tagId,
    title: bookmark.title,
    description: bookmark.description,
    url: bookmark.url,
    public: bookmark.public,
    clickCount: bookmark.clickCount,
    createdAt: formatDate(bookmark.createdAt),
    lastClick: formatDate(bookmark.lastClick),
    tagName: tagName ?? bookmark.tag?.name
  };
}

function serializeNote(note: Note, tagName?: string) {
  return {
    id: note.id,
    userId: note.userId,
    tagId: note.tagId,
    content: note.content,
    createdAt: formatDate(note.createdAt),
    public: note.public,
    tagName
  };
}

function serializeAdvice(advice: Advice & { user?: User | null }) {
  return {
    id: advice.id,
    userId: advice.userId,
    comment: advice.comment,
    createdAt: formatDate(advice.createdAt),
    state: advice.state,
    username: advice.user?.username
  };
}

async function getDefaultTagId(fastify: Parameters<FastifyPluginAsync>[0], userId: number) {
  const existing = await fastify.prisma.tag.findFirst({
    where: {
      userId,
      name: '未分类'
    }
  });

  if (existing) {
    return existing.id;
  }

  const created = await fastify.prisma.tag.create({
    data: {
      userId,
      name: '未分类',
      lastUse: new Date(),
      sort: 0,
      show: 1
    }
  });

  return created.id;
}

async function loadTagMaps(fastify: Parameters<FastifyPluginAsync>[0], userId: number) {
  const tags = await fastify.prisma.tag.findMany({
    where: { userId }
  });

  return new Map(tags.map((tag) => [tag.id, tag.name]));
}

const apiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/userRegister', async (request, reply) => {
    const body = (request.body || {}) as { username?: string; password?: string; email?: string };

    if (!body.username || !body.password || !body.email) {
      return reply.send(fail(1, '缺少注册参数'));
    }

    try {
      const user = await fastify.prisma.user.create({
        data: {
          username: body.username,
          email: body.email,
          passwordHash: await hashPassword(body.password),
          passwordAlgo: 'scrypt',
          searchHistory: '[]',
          quickUrl: JSON.stringify({
            B: 'https://www.baidu.com/',
            G: 'https://www.google.com.hk/',
            H: 'https://github.com/'
          }),
          createdAt: new Date(),
          lastLogin: new Date()
        }
      });

      await getDefaultTagId(fastify, user.id);
      return reply.send(ok(user.id, '注册成功'));
    } catch (error) {
      return reply.send(fail(1, String(error)));
    }
  });

  fastify.post('/userLogin', async (request, reply) => {
    const body = (request.body || {}) as { username?: string; password?: string };
    const user = body.username
      ? await fastify.prisma.user.findUnique({
          where: { username: body.username }
        })
      : null;

    if (!user || !body.password) {
      return reply.send(fail(2, '账号或者密码错误'));
    }

    const result = await verifyPassword(body.password, user.passwordHash, user.passwordAlgo);
    if (!result.valid) {
      return reply.send(fail(2, '账号或者密码错误'));
    }

    const updatedUser = await fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        ...(user.passwordAlgo === 'md5_legacy' && result.nextHash && result.nextAlgo
          ? {
              passwordHash: result.nextHash,
              passwordAlgo: result.nextAlgo
            }
          : {})
      }
    });

    const token = await fastify.jwt.sign(
      {
        id: updatedUser.id,
        username: updatedUser.username
      },
      {
        expiresIn: '30d'
      }
    );

    return reply.send(ok(serializeUser(updatedUser, token), '登陆成功'));
  });

  fastify.post('/userLogout', async (_request, reply) => {
    return reply.send(ok('', '退出成功'));
  });

  fastify.get(
    '/user',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const query = (request.query || {}) as { full?: string; id?: string };
      if (!query.full) {
        return reply.send(ok(request.user));
      }

      const targetId = Number(query.id || request.user.id);
      const user = await fastify.prisma.user.findUnique({
        where: { id: targetId }
      });

      if (!user) {
        return reply.send(fail(1, '用户不存在'));
      }

      return reply.send(ok(serializeUser(user)));
    }
  );

  fastify.post(
    '/userUpdate',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as Partial<User>;
      const data: Partial<User> = {};

      if (typeof body.searchHistory === 'string') {
        data.searchHistory = body.searchHistory;
      }
      if (typeof body.quickUrl === 'string') {
        data.quickUrl = body.quickUrl;
      }
      if (typeof body.avatar === 'string') {
        data.avatar = body.avatar;
      }
      if (typeof body.email === 'string') {
        data.email = body.email;
      }

      const user = await fastify.prisma.user.update({
        where: { id: request.user.id },
        data
      });

      return reply.send(ok(serializeUser(user)));
    }
  );

  fastify.post(
    '/userResetPwd',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as { old?: string; password?: string };
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id }
      });

      if (!user || !body.old || !body.password) {
        return reply.send(fail(1, '参数错误'));
      }

      if (user.username === 'test') {
        return reply.send(ok(0, 'test账号不允许修改密码!'));
      }

      const result = await verifyPassword(body.old, user.passwordHash, user.passwordAlgo);
      if (!result.valid) {
        return reply.send(ok(0, '旧密码认证失败!'));
      }

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(body.password),
          passwordAlgo: 'scrypt'
        }
      });

      return reply.send(ok(1, '密码更新成功!'));
    }
  );

  fastify.get(
    '/tags',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const [tags, bookmarkCounts, noteCounts] = await Promise.all([
        fastify.prisma.tag.findMany({
          where: { userId: request.user.id },
          orderBy: [{ sort: 'asc' }, { lastUse: 'desc' }]
        }),
        fastify.prisma.bookmark.groupBy({
          by: ['tagId'],
          where: { userId: request.user.id },
          _count: { tagId: true }
        }),
        fastify.prisma.note.groupBy({
          by: ['tagId'],
          where: { userId: request.user.id },
          _count: { tagId: true }
        })
      ]);

      const data = tags.map((tag) =>
        serializeTag(tag, bookmarkCounts.find((item) => item.tagId === tag.id)?._count.tagId ?? 0, noteCounts.find((item) => item.tagId === tag.id)?._count.tagId ?? 0)
      );

      return reply.send(ok(data));
    }
  );

  fastify.post(
    '/tagAdd',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as { name?: string };
      if (!body.name) {
        return reply.send(fail(1, '分类名不能为空'));
      }

      const tag = await fastify.prisma.tag.create({
        data: {
          userId: request.user.id,
          name: body.name,
          lastUse: new Date(),
          sort: 0,
          show: 1
        }
      });

      return reply.send(ok(tag.id, `分类 ${body.name} 添加成功`));
    }
  );

  fastify.post(
    '/tagUpdate',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as Partial<Tag> & { id?: number };
      if (!body.id) {
        return reply.send(fail(1, '缺少分类 id'));
      }

      await fastify.prisma.tag.update({
        where: { id: Number(body.id) },
        data: {
          ...(typeof body.name === 'string' ? { name: body.name } : {}),
          ...(typeof body.sort === 'number' ? { sort: body.sort } : {}),
          ...(typeof body.show === 'number' ? { show: body.show } : {}),
          lastUse: new Date()
        }
      });

      return reply.send(ok(1));
    }
  );

  fastify.post(
    '/tagSort',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as { tags?: Array<{ id: number; sort: number }> };
      const tags = body.tags || [];

      await fastify.prisma.$transaction(
        tags.map((tag) =>
          fastify.prisma.tag.update({
            where: { id: tag.id },
            data: {
              sort: tag.sort
            }
          })
        )
      );

      return reply.send(ok(tags.length, '分类排序更新成功！'));
    }
  );

  fastify.post(
    '/tagDel',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as { id?: number };
      if (!body.id) {
        return reply.send(fail(1, '缺少分类 id'));
      }

      await fastify.prisma.$transaction([
        fastify.prisma.bookmark.deleteMany({
          where: {
            userId: request.user.id,
            tagId: Number(body.id)
          }
        }),
        fastify.prisma.note.deleteMany({
          where: {
            userId: request.user.id,
            tagId: Number(body.id)
          }
        }),
        fastify.prisma.tag.delete({
          where: { id: Number(body.id) }
        })
      ]);

      return reply.send(ok(1, '分类删除成功'));
    }
  );

  fastify.get(
    '/bookmark',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const query = request.query as { id?: string };
      const id = Number(query.id || 0);
      const bookmark = await fastify.prisma.bookmark.findUnique({
        where: { id },
        include: { tag: true }
      });

      if (!bookmark) {
        return reply.send(fail(1, '书签不存在'));
      }

      if (bookmark.userId !== request.user.id && bookmark.public !== 1) {
        return reply.send(fail(1, '无权访问该书签'));
      }

      return reply.send(ok(serializeBookmark(bookmark)));
    }
  );

  fastify.post(
    '/bookmarkAdd',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as Partial<Bookmark>;
      if (!body.url || !body.title) {
        return reply.send(fail(1, '书签缺少标题或链接'));
      }

      const existing = await fastify.prisma.bookmark.findFirst({
        where: {
          userId: request.user.id,
          url: body.url
        }
      });

      if (existing) {
        await fastify.prisma.bookmark.update({
          where: { id: existing.id },
          data: {
            createdAt: new Date()
          }
        });

        return reply.send(ok(existing.id, `书签 ${body.title} 已存在，更新创建日期！`));
      }

      const tagId = body.tagId ? Number(body.tagId) : await getDefaultTagId(fastify, request.user.id);
      const bookmark = await fastify.prisma.bookmark.create({
        data: {
          userId: request.user.id,
          tagId,
          title: body.title,
          description: body.description || '',
          url: body.url,
          public: Number(body.public || 0),
          clickCount: 1,
          createdAt: new Date(),
          lastClick: new Date()
        }
      });

      await fastify.prisma.tag.update({
        where: { id: tagId },
        data: {
          lastUse: new Date()
        }
      });

      return reply.send(ok(bookmark.id, `书签 ${body.title} 添加成功`));
    }
  );

  fastify.post(
    '/bookmarkDel',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as { id?: number };
      await fastify.prisma.bookmark.deleteMany({
        where: {
          id: Number(body.id || 0),
          userId: request.user.id
        }
      });

      return reply.send(ok(1, '书签删除成功'));
    }
  );

  fastify.post(
    '/bookmarkUpdate',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as Partial<Bookmark> & { id?: number };
      if (!body.id) {
        return reply.send(fail(1, '缺少书签 id'));
      }

      await fastify.prisma.bookmark.update({
        where: { id: Number(body.id) },
        data: {
          ...(typeof body.title === 'string' ? { title: body.title } : {}),
          ...(typeof body.url === 'string' ? { url: body.url } : {}),
          ...(typeof body.description === 'string' ? { description: body.description } : {}),
          ...(typeof body.tagId === 'number' ? { tagId: body.tagId } : {}),
          ...(typeof body.public === 'number' ? { public: body.public } : {})
        }
      });

      return reply.send(ok(1));
    }
  );

  fastify.post(
    '/bookmarkClick',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as { id?: number };
      await fastify.prisma.bookmark.updateMany({
        where: {
          id: Number(body.id || 0),
          userId: request.user.id
        },
        data: {
          clickCount: { increment: 1 },
          lastClick: new Date()
        }
      });

      return reply.send(ok(1));
    }
  );

  fastify.post(
    '/bookmarShortcut',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as { url?: string };
      const bookmark = body.url
        ? await fastify.prisma.bookmark.findFirst({
            where: {
              userId: request.user.id,
              url: body.url
            }
          })
        : null;

      if (!bookmark) {
        return reply.send(ok(false));
      }

      await fastify.prisma.bookmark.update({
        where: { id: bookmark.id },
        data: {
          clickCount: { increment: 1 },
          lastClick: new Date()
        }
      });

      return reply.send(ok(true));
    }
  );

  fastify.get(
    '/bookmarksByTag',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const query = request.query as {
        tagId?: string;
        page?: string;
        pageSize?: string;
        showType?: string;
      };
      const tagId = Number(query.tagId || -1);
      const showType = query.showType === 'lastClick' || query.showType === 'clickCount' ? query.showType : 'createdAt';
      const currentPage = Number(query.page || 1);
      const pageSize = Math.max(Number(query.pageSize || 50), 1);

      const where =
        tagId === -1
          ? {
              userId: request.user.id
            }
          : {
              userId: request.user.id,
              tagId
            };

      const count = await fastify.prisma.bookmark.count({ where });
      const rows = await fastify.prisma.bookmark.findMany({
        where,
        orderBy: showType === 'clickCount' ? { clickCount: 'desc' } : showType === 'lastClick' ? { lastClick: 'desc' } : { createdAt: 'desc' },
        skip: currentPage <= 0 ? 0 : (currentPage - 1) * pageSize,
        take: pageSize,
        include: { tag: true }
      });

      const data = rows.map((bookmark) => serializeBookmark(bookmark));
      return reply.send(ok(toCountSelect(data, count, currentPage, pageSize)));
    }
  );

  fastify.get(
    '/bookmarksSearch',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const query = request.query as {
        keyword?: string;
        range?: string;
        tagIds?: string | string[];
        createdAt?: string;
        lastClick?: string;
        page?: string;
        pageSize?: string;
      };
      const { currentPage, pageSize, skip } = toPagination(query.page, query.pageSize);
      const range = query.range === 'other' ? 'other' : 'self';

      const tagIds = Array.isArray(query.tagIds)
        ? query.tagIds.map((value) => Number(value))
        : typeof query.tagIds === 'string' && query.tagIds.length > 0
          ? query.tagIds.split(',').map((value) => Number(value))
          : [];

      const where: Record<string, unknown> = {};
      if (range === 'self') {
        where.userId = request.user.id;
      } else if (range === 'other') {
        where.userId = { not: request.user.id };
        where.public = 1;
      }
      if (query.keyword) {
        where.OR = [{ title: { contains: query.keyword } }, { url: { contains: query.keyword } }];
      }
      if (tagIds.length > 0 && range === 'self') {
        where.tagId = { in: tagIds };
      }

      const createdAt = parseRange(query.createdAt);
      if (createdAt) {
        where.createdAt = createdAt;
      }
      const lastClick = parseRange(query.lastClick);
      if (lastClick) {
        where.lastClick = lastClick;
      }

      const [count, rows] = await Promise.all([
        fastify.prisma.bookmark.count({ where }),
        fastify.prisma.bookmark.findMany({
          where,
          include: { tag: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        })
      ]);

      const data = rows.map((bookmark) => serializeBookmark(bookmark));
      return reply.send(ok(toCountSelect(data, count, currentPage, pageSize)));
    }
  );

  fastify.post(
    '/noteAdd',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as Partial<Note>;
      const tagId = body.tagId ? Number(body.tagId) : await getDefaultTagId(fastify, request.user.id);
      const note = await fastify.prisma.note.create({
        data: {
          userId: request.user.id,
          tagId,
          content: body.content || '',
          public: Number(body.public || 0),
          createdAt: new Date()
        }
      });

      return reply.send(ok(note.id, '备忘添加成功'));
    }
  );

  fastify.post(
    '/noteUpdate',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as Partial<Note> & {
        id?: number | string;
        tagId?: number | string;
        public?: number | string;
      };
      const id = Number(body.id || 0);
      const tagId = body.tagId === undefined ? undefined : Number(body.tagId);
      const publicValue = body.public === undefined ? undefined : Number(body.public);

      if (!id) {
        return reply.send(fail(1, '缺少备忘 id'));
      }

      await fastify.prisma.note.update({
        where: { id },
        data: {
          ...(typeof body.content === 'string' ? { content: body.content } : {}),
          ...(Number.isInteger(tagId) ? { tagId } : {}),
          ...(publicValue === 0 || publicValue === 1 ? { public: publicValue } : {})
        }
      });

      return reply.send(ok(1, '备忘更新成功'));
    }
  );

  fastify.post(
    '/noteDel',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as { id?: number };
      await fastify.prisma.note.deleteMany({
        where: {
          id: Number(body.id || 0),
          userId: request.user.id
        }
      });

      return reply.send(ok(1, '备忘删除成功'));
    }
  );

  fastify.get(
    '/notes',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const query = request.query as {
        keyword?: string;
        tagId?: string;
        page?: string;
        pageSize?: string;
      };
      const { currentPage, pageSize, skip } = toPagination(query.page, query.pageSize);
      const where: Record<string, unknown> = {
        userId: request.user.id
      };

      if (query.keyword) {
        where.content = { contains: query.keyword };
      }
      if (query.tagId) {
        where.tagId = Number(query.tagId);
      }

      const [count, rows, tagMap] = await Promise.all([
        fastify.prisma.note.count({ where }),
        fastify.prisma.note.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        loadTagMaps(fastify, request.user.id)
      ]);

      const data = rows.map((note) => serializeNote(note, tagMap.get(note.tagId)));
      return reply.send(ok(toCountSelect(data, count, currentPage, pageSize)));
    }
  );

  fastify.get('/noteShare', async (request, reply) => {
    const query = request.query as { id?: string; json?: string };
    const note = await fastify.prisma.note.findFirst({
      where: {
        id: Number(query.id || 0),
        public: 1
      }
    });

    if (!note) {
      if (query.json) {
        return reply.send({ message: '备忘为非公开或者已删除!' });
      }

      return reply.type('text/html').send('备忘为非公开或者已删除!');
    }

    if (query.json) {
      try {
        return reply.send(JSON.parse(note.content));
      } catch {
        return reply.send({ content: note.content });
      }
    }

    return reply.type('text/html').send(`<pre>${note.content}</pre>`);
  });

  fastify.post(
    '/adviceAdd',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const body = (request.body || {}) as { comment?: string };
      const advice = await fastify.prisma.advice.create({
        data: {
          userId: request.user.id,
          comment: body.comment || '',
          createdAt: new Date(),
          state: 0
        }
      });

      return reply.send(ok(advice.id, '留言 添加成功'));
    }
  );

  fastify.get(
    '/advices',
    {
      preHandler: fastify.authenticate
    },
    async (_request, reply) => {
      const advices = await fastify.prisma.advice.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send(ok(advices.map((advice) => serializeAdvice(advice))));
    }
  );

  fastify.get(
    '/bookmarkBackup',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const tags = await fastify.prisma.tag.findMany({
        where: { userId: request.user.id },
        orderBy: [{ sort: 'asc' }, { lastUse: 'desc' }]
      });

      let content = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

      for (const tag of tags) {
        const bookmarks = await fastify.prisma.bookmark.findMany({
          where: { tagId: tag.id }
        });
        if (bookmarks.length === 0) {
          continue;
        }
        content += `<DT><H3>${tag.name}</H3>\n<DL><p>\n`;
        for (const bookmark of bookmarks) {
          content += `<DT><A HREF="${bookmark.url}">${bookmark.title}</A>\n`;
        }
        content += `</DL><p>\n`;
      }
      content += `</DL><p>\n`;

      const backupDir = join(import.meta.dirname, '../../data/backup');
      await mkdir(backupDir, { recursive: true });
      const fileName = `exportbookmark-${request.user.username}-${Date.now()}.html`;
      await writeFile(join(backupDir, fileName), content, 'utf8');

      return reply.send(ok(fileName));
    }
  );

  fastify.get('/bookmarkDownload', async (request, reply) => {
    const query = request.query as { fileName?: string };
    const fileName = basename(query.fileName || '');
    const filePath = join(import.meta.dirname, '../../data/backup', fileName);

    if (!fileName || !existsSync(filePath)) {
      return reply.type('text/plain').send('文件不存在！');
    }

    reply.header('content-disposition', `attachment; filename="${fileName}"`);
    return reply.send(createReadStream(filePath));
  });

  fastify.get('/article', async (request, reply) => {
    const query = request.query as { url?: string };
    if (!query.url) {
      return reply.send(fail(1, '缺少 url'));
    }

    try {
      const response = await fetch(query.url);
      const html = await response.text();
      const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() || query.url;
      return reply.send(ok({ title }));
    } catch (error) {
      return reply.send(fail(1, String(error)));
    }
  });

  fastify.post(
    '/bookmarkUpload',
    {
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      if (!request.user) {
        return;
      }

      const file = await request.file();
      if (!file) {
        return reply.send(fail(1, '请选择书签文件'));
      }

      const content = (await file.toBuffer()).toString('utf8');
      const imported = parseBookmarkHtml(content);
      const existingTags = await fastify.prisma.tag.findMany({
        where: { userId: request.user.id }
      });
      const tagMap = new Map(existingTags.map((tag) => [tag.name, tag.id]));

      let count = 0;
      let repeat = 0;
      let failed = 0;

      for (const item of imported) {
        try {
          const existing = await fastify.prisma.bookmark.findFirst({
            where: {
              userId: request.user.id,
              url: item.url
            }
          });

          if (existing) {
            repeat += 1;
            continue;
          }

          let tagId = tagMap.get(item.tagName);
          if (!tagId) {
            const tag = await fastify.prisma.tag.create({
              data: {
                userId: request.user.id,
                name: item.tagName,
                lastUse: new Date(),
                sort: 0,
                show: 1
              }
            });
            tagId = tag.id;
            tagMap.set(item.tagName, tag.id);
          }

          await fastify.prisma.bookmark.create({
            data: {
              userId: request.user.id,
              tagId,
              title: item.title,
              url: item.url,
              description: '',
              public: 0,
              clickCount: item.clickCount,
              createdAt: new Date(),
              lastClick: new Date()
            }
          });

          count += 1;
        } catch {
          failed += 1;
        }
      }

      return reply.send(ok(count, `书签传入${imported.length}个，重复书签${repeat}个，${failed}个导入失败，成功导入${count}个。`));
    }
  );
};

export default apiRoutes;
