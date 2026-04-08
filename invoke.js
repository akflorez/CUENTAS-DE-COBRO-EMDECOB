const { getInvoiceStats, getConjuntos } = require('./.next/server/app/actions/invoice.js') || {};

async function test() {
  try {
    const res = await getConjuntos();
    console.log("Conjuntos:", res);
    
    const stats = await getInvoiceStats();
    console.log("Stats:", stats);
  } catch (err) {
    console.error("Error:", err);
  }
}

// Since Next.js compiled it as ES modules, we should probably run `npx tsx src/app/actions/invoice.ts` directly.
