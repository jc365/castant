// backend/src/infrastructure/persistence/prismaClient.ts
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL || 'file:./dev.db';

// 🔥 Detectar si es PostgreSQL o SQLite/libsql
const isPostgres = url.startsWith('postgresql://');

let prisma: PrismaClient;

if (isPostgres) {
  const adapter = new PrismaPg({ url });
  prisma = new PrismaClient({ adapter });
} else {
  const adapter = new PrismaLibSql({ url });
  prisma = new PrismaClient({ adapter });
}

export default prisma;
