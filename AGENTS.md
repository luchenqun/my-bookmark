# 仓库指南

## 项目结构与模块组织

`src/` 包含 Fastify 后端。可复用的辅助函数放在 `src/lib/`，Fastify 插件放在 `src/plugins/`，路由注册放在 `src/routes/`，入口文件是 `src/server.ts`。Prisma 的 schema、迁移和种子数据位于 `prisma/`。迁移相关工具位于 `scripts/`。测试放在 `test/`，例如 `test/auth.test.ts`。旧版前端直接由 `public/` 提供服务；将它视为唯一的前端源码。构建产物输出到 `dist/`，不要手动编辑。

## 构建、测试与开发命令

使用 `npm install` 安装依赖。`npm run dev` 通过 `tsx watch` 启动 Fastify 服务用于本地开发。`npm run build` 将 TypeScript 编译到 `dist/`，`npm run start` 运行编译后的服务。`npm test` 运行一次 Vitest 测试套件；`npm run test:watch` 进入交互式监听循环。`npm run format` 执行 Prettier 格式化，`npm run format:check` 以类似 CI 的方式检查格式。Prisma 相关任务包括 `npm run prisma:generate`、`npm run prisma:migrate`、`npm run prisma:seed` 和 `npm run prisma:studio`。

## 编码风格与命名约定

本项目使用严格模式的 TypeScript 和 ES modules。遵循现有风格：单引号、分号、不要尾随逗号，并保持 Prettier 配置中的较宽 `printWidth`。优先编写小而专注的模块，并在合适时使用具名导出。变量和函数使用 `camelCase`，类型和接口使用 `PascalCase`，文件名仅在仓库已有此模式时使用 kebab-case，例如 [`bookmark-html.ts`](./src/lib/bookmark-html.ts)。路由文件和插件文件应与各自职责保持一致。

## 测试指南

Vitest 运行在 Node 环境下，并匹配 `test/**/*.test.ts`。新增测试文件应按所验证的行为命名，例如 `startup.test.ts` 或 `migration.test.ts`。只要后端行为、启动逻辑、认证流程或迁移代码发生变化，就应新增或更新测试。优先编写聚焦的请求级测试，并使用 `app.inject()` 测试 Fastify 端点。

## 提交与 Pull Request 指南

最近的提交历史偏好简短的祈使句标题，并经常使用 Conventional Commit 前缀，例如 `feat:` 和 `docs:`。如有可能，请遵循这一模式，例如 `feat: add import validation` 或 `fix: handle missing JWT secret`。Pull Request 应说明变更内容，注明是否涉及 schema 或数据迁移，关联相关 issue，并且只有在 `public/` 中的 UI 行为发生变化时才附上截图。

## 工作备注

不要手动编辑 `dist/`，也不要提交 `data/` 下生成的运行时产物，除非该变更本身就是为了更新已纳入版本控制的 fixture 或迁移输出。修改搜索路径或文件访问逻辑时，必须保留 `public/` 作为前端根目录，并在结束前使用 `npm test` 和 `npm run format:check` 进行验证。
