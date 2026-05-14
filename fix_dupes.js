const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:8NbV8gu2bJir5tZ1TlR2fC81w6G7uSc5R6tjYAMTzEpFy4ZnPjvP6QSP6tevfraz@84.247.130.122:5433/postgres',
  ssl: false
});

async function main() {
  await client.connect();
  
  const { rows } = await client.query(`
    SELECT id, consecutivo, "conjuntoNombre", "honorariosTotal",
           COALESCE("generacionMes", EXTRACT(MONTH FROM "createdAt")::int) as mes_gen,
           COALESCE("generacionAnio", EXTRACT(YEAR FROM "createdAt")::int) as anio_gen,
           "createdAt"
    FROM "Invoice"
    ORDER BY "conjuntoNombre", "createdAt" DESC
  `);

  // Agrupar por nombre + monto + mes generación
  const groups = {};
  rows.forEach(inv => {
    const key = `${inv.conjuntoNombre.trim().toUpperCase()}|${Math.round(inv.honorariosTotal)}|${inv.mes_gen}-${inv.anio_gen}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(inv);
  });

  const dupes = Object.entries(groups).filter(([_, items]) => items.length > 1);
  const idsToDelete = [];

  dupes.forEach(([key, items]) => {
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    for (let i = 1; i < items.length; i++) {
      idsToDelete.push(items[i].id);
      console.log(`ELIMINAR: [${items[i].consecutivo}] ${items[i].conjuntoNombre}`);
    }
  });

  console.log(`\nEliminando ${idsToDelete.length} duplicados...`);
  for (const id of idsToDelete) {
    await client.query(`DELETE FROM "InvoiceItem" WHERE "invoiceId" = $1`, [id]);
    await client.query(`DELETE FROM "Invoice" WHERE id = $1`, [id]);
    console.log(`  OK: ${id}`);
  }

  const { rows: count } = await client.query(`SELECT COUNT(*) as total FROM "Invoice"`);
  console.log(`\nRegistros restantes: ${count[0].total}`);
  
  await client.end();
}

main().catch(console.error);
