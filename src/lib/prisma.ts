import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const createPrismaClient = () => {
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
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
