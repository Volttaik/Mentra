import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@mentra.app";
  const username = "mentra-admin";
  const password = "AdminMentra2026!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists:", email);
    await prisma.$disconnect();
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: "Mentra Admin",
      username,
      email,
      password: hashed,
      role: "ADMIN",
      isVerified: true,
    },
  });

  console.log("✅ Created admin user:");
  console.log("   Email:   ", email);
  console.log("   Password:", password);
  console.log("   Login at: /admin/login");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
