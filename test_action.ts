import { getInvoiceStats, getConjuntos } from './src/app/actions/invoice';

async function test() {
  try {
    console.log("Fetching conjuntos...");
    const conjuntos = await getConjuntos();
    console.log("Conjuntos result:", conjuntos);

    console.log("Fetching invoice stats...");
    const stats = await getInvoiceStats();
    console.log("Stats result:", stats);
  } catch (err: any) {
    console.error("Test failed with exception:", err.message);
    console.error(err.stack);
  }
}

test();
