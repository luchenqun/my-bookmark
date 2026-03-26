# 在线书签管理工具

这是 `my-bookmark` 项目的重构版本。

新版本将后端改为 `Fastify + Prisma + SQLite + TypeScript`，并把前端静态资源直接收拢到当前项目中的 `public/` 目录里。

## 在线书签能做什么

浏览器自带的书签虽然够用，但在实际使用里经常会遇到这些问题：

1. 重装系统或者更换浏览器之后，书签迁移很麻烦
2. 多台设备、多种浏览器之间的书签难以统一
3. 收藏的网址越来越多，后续查找效率会越来越低
4. 想按分类、关键字、时间范围快速搜索并不方便
5. 希望在任意一台联网设备上都能访问自己的书签
6. 除了书签之外，还希望顺手记录一点备忘信息

这个项目的目标，就是把这些零散的网址、标签和备忘录统一收拢起来，让你在任何能联网的地方都能打开自己的书签系统。

## 主要功能

- 支持账号注册、登录和鉴权
- 支持书签新增、编辑、删除、搜索和分类管理
- 支持书签公开/私有
- 支持导入浏览器导出的书签 HTML 文件
- 支持导出书签
- 支持备忘录功能
- 支持全局快捷链接配置
- 增加[Chrome插件](https://chromewebstore.google.com/detail/%E4%B9%A6%E7%AD%BE%E5%BF%AB%E9%80%9F%E6%B7%BB%E5%8A%A0/ihhmiedcjcoibfidjmacmfmgohbjgjid)，可在任意界面快速添加书签至系统。如果你无法访问该插件，可以按照[Chrome如何安装插件（开发版本/自制）](https://jingyan.baidu.com/article/f3ad7d0f58d6b609c3345b80.html)方法安装插件，插件请到[bookmark-plugin](https://github.com/luchenqun/bookmark-plugin)下载。   
- 适配手机平板，手机端请访问[mb.lucq.fun](http://mb.lucq.fun/)。

## 主要技术栈

- **Fastify**: 后端 Web 框架
- **Prisma**: 数据模型与数据库访问层
- **SQLite**: 默认数据存储
- **TypeScript**: 后端与脚本统一使用 TS
- **Vitest**: 测试框架
- **Prettier**: 代码格式化

## 目录结构

```text
bookmark/
├── public/               前端静态资源，唯一前端来源
├── src/                  后端源码
│   ├── lib/              通用工具与辅助函数
│   ├── plugins/          Fastify 插件
│   └── routes/           路由定义
├── prisma/               Prisma schema、migration、seed
├── scripts/              数据迁移与校验脚本
├── test/                 Vitest 测试
├── data/                 本地数据目录
│   ├── app.db            默认 SQLite 数据库
│   ├── backup/           导出文件与本地备份
│   └── upload/           预留上传目录
├── dist/                 TypeScript 编译产物
├── package.json          项目脚本与依赖
└── README.md             项目说明文件
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 环境变量

项目默认读取根目录下的 `.env`：

```env
DATABASE_URL="file:./data/app.db"
JWT_SECRET="bookmark-secret"
```

### 3. 启动开发模式

```bash
npm run dev
```

开发模式下使用 `tsx` 直接运行 `src/server.ts`。

### 4. 构建并启动

```bash
npm run build
npm run start
```

服务启动成功后，终端会打印访问地址，例如：

```text
Local: http://localhost:8157
Network: http://127.0.0.1:8157
```

## 使用 Docker 镜像部署

已发布镜像：

- Docker Hub: [`luchenqun/mybookmark`](https://hub.docker.com/repository/docker/luchenqun/mybookmark)

### 1. 拉取镜像

```bash
docker pull luchenqun/mybookmark:latest
```

### 2. 启动容器

项目默认监听 `8157` 端口，默认 SQLite 数据库位于容器内的 `./data/app.db`。实际部署时建议把数据目录挂载到宿主机，避免容器重建后数据丢失。

```bash
docker run -d \
  --name mybookmark \
  -p 8157:8157 \
  -e JWT_SECRET='请改成你自己的密钥' \
  -e DATABASE_URL='file:./data/app.db' \
  -v $(pwd)/data:/app/data \
  luchenqun/mybookmark:latest
```

启动后可通过以下地址访问：

```text
http://localhost:8157
```

### 3. 常用容器命令

查看日志：

```bash
docker logs -f mybookmark
```

停止容器：

```bash
docker stop mybookmark
```

删除容器：

```bash
docker rm -f mybookmark
```

### 4. 升级镜像

```bash
docker pull luchenqun/mybookmark:latest
docker rm -f mybookmark
docker run -d \
  --name mybookmark \
  -p 8157:8157 \
  -e JWT_SECRET='请改成你自己的密钥' \
  -e DATABASE_URL='file:./data/app.db' \
  -v $(pwd)/data:/app/data \
  luchenqun/mybookmark:latest
```

## 常用命令

### 开发与运行

```bash
npm run dev
npm run build
npm run start
```

### 测试

```bash
npm test
npm run test:watch
```

### 格式化

```bash
npm run format
npm run format:check
```

### Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed
```

## 数据说明

- 默认数据库文件位于 [`data/app.db`](./data/app.db)
- 前端静态资源位于 [`public`](./public)
- `public/` 是当前项目的唯一前端来源

## 数据迁移

当前项目的数据迁移方向是：

**MySQL -> SQLite**

如果你可以直接访问旧项目的 MySQL，那么直接连接旧库迁移即可，不需要先导出 dump。

### 1. 准备旧 MySQL 连接信息

迁移前先确认这些参数：

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

### 2. 执行迁移脚本

项目已经内置迁移命令，可以直接从旧 MySQL 读取数据并写入当前项目的 SQLite：

```bash
MYSQL_HOST=你的主机 \
MYSQL_PORT=你的端口 \
MYSQL_USER=你的账号 \
MYSQL_PASSWORD=你的密码 \
MYSQL_DATABASE=你的数据库名 \
npm run migrate:mysql
```

默认会把数据写入当前项目的：

- [`data/app.db`](./data/app.db)

常用环境变量如下：

- `MYSQL_HOST`：MySQL 主机，默认 `127.0.0.1`
- `MYSQL_PORT`：MySQL 端口，默认 `3306`
- `MYSQL_USER`：MySQL 用户，默认 `root`
- `MYSQL_PASSWORD`：MySQL 密码，默认 `123456`
- `MYSQL_DATABASE`：旧 MySQL 数据库名，默认 `mybookmarks`
- `MIGRATION_DATABASE_URL`：迁移目标 SQLite，默认写入当前项目的 `DATABASE_URL`

### 3. 校验迁移结果

迁移完成后，执行：

```bash
MYSQL_HOST=你的主机 \
MYSQL_PORT=你的端口 \
MYSQL_USER=你的账号 \
MYSQL_PASSWORD=你的密码 \
MYSQL_DATABASE=你的数据库名 \
npm run verify:migration
```

这个命令会：

- 重新读取旧 MySQL 数据
- 对比 SQLite 中的导入结果
- 输出各表数量是否一致

### 4. 查看迁移输出文件

迁移完成后，通常会生成这些文件：

- [`data/app.db`](./data/app.db)
- [`data/migration-report.json`](./data/migration-report.json)
- [`data/suspicious-bookmark-urls.json`](./data/suspicious-bookmark-urls.json)

其中：

- `app.db` 是最终 SQLite 数据库
- `migration-report.json` 是迁移统计报告
- `suspicious-bookmark-urls.json` 是迁移过程中标记出的可疑 URL 列表，方便人工复核

### 5. 推荐执行顺序

建议完整流程按这个顺序执行：

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 连接旧 MySQL 执行迁移
MYSQL_HOST=你的主机 \
MYSQL_PORT=你的端口 \
MYSQL_USER=你的账号 \
MYSQL_PASSWORD=你的密码 \
MYSQL_DATABASE=你的数据库名 \
npm run migrate:mysql

# 4. 校验迁移
MYSQL_HOST=你的主机 \
MYSQL_PORT=你的端口 \
MYSQL_USER=你的账号 \
MYSQL_PASSWORD=你的密码 \
MYSQL_DATABASE=你的数据库名 \
npm run verify:migration
```

## 开发约定

- `public/` 是唯一前端来源
- `node_modules/`、`dist/`、`data/*.db` 不提交到 git
- 代码格式化使用 `Prettier`
- 编辑器风格由 `.editorconfig` 统一

## 相关文件

- [`package.json`](./package.json)
- [`src/server.ts`](./src/server.ts)
- [`src/routes/api.ts`](./src/routes/api.ts)
- [`src/plugins/static.ts`](./src/plugins/static.ts)
- [`prisma/schema.prisma`](./prisma/schema.prisma)
- [`.gitignore`](./.gitignore)
- [`prettier.config.mjs`](./prettier.config.mjs)
- [`.editorconfig`](./.editorconfig)
