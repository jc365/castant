/**
 * @file index.ts
 * @module backend
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import logger from './infrastructure/logging/logger';
import { requestContextMiddleware, getRequestId } from './infrastructure/logging/requestContext';
import v1Router from './infrastructure/api/v1/routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(requestContextMiddleware);

import pinoHttp from 'pino-http';

const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} → ${res.statusCode} ${err.message}`,
  customProps: () => {
    const requestId = getRequestId();
    return requestId ? { requestId } : {};
  },
  customAttributeKeys: { req: 'request', res: 'response' },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      ...(req.body ? { body: req.body } : {}),
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
});

app.use(httpLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1', v1Router);

export default app;

// Solo inicia el servidor si se ejecuta directamente (no en tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => {
    logger.info({ port }, 'Server started');
  });
}