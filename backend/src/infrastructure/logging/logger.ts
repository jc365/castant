/**
 * @file logger.ts
 * @module infrastructure/logging
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'debug',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

export default logger;
