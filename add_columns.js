const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Invoice" ADD COLUMN "generacionMes" INTEGER, ADD COLUMN "generacionAnio" INTEGER;');
    console.log('Columns added successfully');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Columns already exist');
    } else {
      console.error('Error adding columns:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

run();
