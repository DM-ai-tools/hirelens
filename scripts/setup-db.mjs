import "dotenv/config";
import pg from "pg";

const adminUrl =
  process.env.DATABASE_ADMIN_URL ||
  "postgresql://postgres:root@localhost:5432/postgres";

const targetDb = (() => {
  try {
    const u = new URL(process.env.DATABASE_URL);
    return u.pathname.replace(/^\//, "").split("?")[0] || "hirelens";
  } catch {
    return "hirelens";
  }
})();

const pool = new pg.Pool({ connectionString: adminUrl });
const client = await pool.connect();

try {
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
    targetDb,
  ]);
  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${targetDb}"`);
    console.log(`Created database: ${targetDb}`);
  } else {
    console.log(`Database already exists: ${targetDb}`);
  }
} finally {
  client.release();
  await pool.end();
}
