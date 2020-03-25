const fileCache = require('think-cache-file');
const nunjucks = require('think-view-nunjucks');
const JWTSession = require('think-session-jwt');
const mysql = require('think-model-mysql');
const {Console, File, DateFile} = require('think-logger3');
const path = require('path');
const isDev = think.env === 'development';

/**
 * cache adapter config
 * @type {Object}
 */
exports.cache = {
  type: 'file',
  common: {
    timeout: 24 * 60 * 60 * 1000 // millisecond
  },
  file: {
    handle: fileCache,
    cachePath: path.join(think.ROOT_PATH, 'runtime/cache'), // absoulte path is necessarily required
    pathDepth: 1,
    gcInterval: 24 * 60 * 60 * 1000 // gc interval
  }
};

/**
 * model adapter config
 * @type {Object}
 */
exports.model = {
  type: 'mysql',
  common: {
    logConnect: isDev,
    logSql: isDev,
    logger: msg => think.logger.info(msg)
  },
  mysql: {
    handle: mysql,
    database: 'mybookmarks',
    prefix: '',
    encoding: 'utf8',
    host: '127.0.0.1',
    port: '3306',
    user: 'test',
    password: '123456',
    dateStrings: true
  }
};

/**
 * session adapter config
 * @type {Object}
 */
exports.session = {
  type: 'jwt',
  common: {
    cookie: {
      name: 'thinkjs',
    }
  },
  jwt: {
    handle: JWTSession,
    secret: 'secret', // secret is reqired
    tokenType: 'header', // ['query', 'body', 'header', 'cookie'], 'cookie' is default
    tokenName: 'authorization', // if tokenType not 'cookie', this will be token name, 'jwt' is default 后端字母要小写
    sign: {
      // sign options is not required
      expiresIn: '604800s' // 7天过期
    },
    verify: {
      // verify options is not required
    },
    verifyCallback: (error) => { throw new Error("token verify error"); }, // default verify fail callback
  }
}

/**
 * view adapter config
 * @type {Object}
 */
exports.view = {
  type: 'nunjucks',
  common: {
    viewPath: path.join(think.ROOT_PATH, 'view'),
    sep: '_',
    extname: '.html'
  },
  nunjucks: {
    handle: nunjucks
  }
};

/**
 * logger adapter config
 * @type {Object}
 */
exports.logger = {
  type: isDev ? 'console' : 'dateFile',
  console: {
    handle: Console
  },
  file: {
    handle: File,
    backups: 10, // max chunk number
    absolute: true,
    maxLogSize: 50 * 1024, // 50M
    filename: path.join(think.ROOT_PATH, 'logs/app.log')
  },
  dateFile: {
    handle: DateFile,
    level: 'ALL',
    absolute: true,
    pattern: '-yyyy-MM-dd',
    alwaysIncludePattern: true,
    filename: path.join(think.ROOT_PATH, 'logs/app.log')
  }
};
