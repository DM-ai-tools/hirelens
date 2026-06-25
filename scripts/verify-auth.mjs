import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const emails = ["recruiter@dotmappers.in", "admin@dotmappers.in"];
const passwords = { "recruiter@dotmappers.in": "recruiter123", "admin@dotmappers.in": "admin123" };

for (const email of emails) {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) {
    console.log(`${email}: NOT FOUND`);
    continue;
  }
  const ok = await bcrypt.compare(passwords[email], u.passwordHash);
  console.log(`${email}: active=${u.active} role=${u.role} passwordOk=${ok}`);
}

await prisma.$disconnect();
await pool.end();
