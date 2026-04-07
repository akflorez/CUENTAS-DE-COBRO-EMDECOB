
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking database connection and schema...");
    const count = await prisma.invoice.count();
    console.log(`Total invoices in DB: ${count}`);
    
    if (count > 0) {
      const sample = await prisma.invoice.findFirst();
      console.log("Sample invoice found with id:", sample?.id);
    } else {
      console.log("Database is EMPTY.");
    }
  } catch (err) {
    console.error("DATABASE ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
