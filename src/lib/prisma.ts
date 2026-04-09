import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('CRITICAL: No se encontró la variable DATABASE_URL. Por favor, configúrala en el panel de Coolify.');
    // We throw to prevent incorrect Prisma usage
    throw new Error('CONFIG_ERROR: Base de datos no configurada.');
  }

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  // Test the connection if possible or just return
  return prisma;
}

export default getPrisma;
