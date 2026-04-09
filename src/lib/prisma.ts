import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Singleton instance
let _prisma: PrismaClient | undefined;

const createPrismaClient = () => {
  try {
    const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dummy_db";
    
    // Validar mínimamente la URL para evitar crasheos de Pool
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
       console.warn('DATABASE_URL no tiene un formato válido. Se usará fallback.');
    }

    const pool = new Pool({ 
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Capture pool errors to prevent process crash
    pool.on('error', (err) => {
      console.error('Unexpected error on idle pg pool', err);
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error('Fallo crítico inicializando Prisma Client:', error);
    // Return a bare client as last resort to avoid import-time crash
    return new PrismaClient();
  }
};

// Exportar una función o un objeto con un getter para inicialización perezosa (lazy)
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop, receiver) => {
    if (!_prisma) {
      _prisma = createPrismaClient();
    }
    return Reflect.get(_prisma, prop, receiver);
  }
});

export default prisma;
