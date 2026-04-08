require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const invoices = await prisma.invoice.findMany({ take: 1 });
    fs.writeFileSync('test_output.txt', 'Connected! Invoices: ' + invoices.length);
  } catch (error) {
    fs.writeFileSync('test_output.txt', 'Error connecting: ' + error.message + '\n' + error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
