import { execSync } from 'child_process';
import fs from 'fs';

try {
  const output = execSync('npx prisma generate', { 
    env: { ...process.env, DATABASE_URL: "postgresql://neondb_owner:npg_eWCA1gPd0ryo@ep-icy-thunder-akkkr42v.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require" },
    encoding: 'utf8' 
  });
  console.log("Success:\n", output);
} catch (e) {
  console.log("Failed. Output:\n", e.stdout);
  console.log("Error:\n", e.stderr);
}
