import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dummy_db";
  
  const pool = new Pool({ 
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  
  pool.on('error', (err) => {
    console.error('PG Pool Error:', err);
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ 
    adapter,
    datasources: { db: { url } }
  } as any);

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
  
  return prisma;
}

// Keep default export for backward compatibility but as the getter
export default getPrisma;
