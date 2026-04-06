const { Pool } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_eWCA1gPd0ryo@ep-icy-thunder-akkkr42v.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require";

async function cleanup() {
  const pool = new Pool({ connectionString });
  try {
    const res = await pool.query('DELETE FROM "Invoice" WHERE "consecutivo" = $1', ["TEST-001"]);
    console.log('SUCCESS_DELETE:', res.rowCount);
  } catch (e) {
    console.error('ERROR_DELETE:', e.message);
  } finally {
    await pool.end();
  }
}

cleanup();
