/**
 * [MAINTENANCE — réutilisable] Promotion d’un utilisateur au rôle `ADMIN`.
 *
 * Emplacement : `scripts/maintenance/`.
 *
 * Usage : `pnpm tsx scripts/maintenance/promote-admin.ts <email>`
 */

import { prisma } from "../../lib/prisma";

async function promoteToAdmin(email: string) {
  try {
    if (!prisma) {
      console.error("❌ Prisma client not initialized");
      process.exit(1);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    if (user.role === "ADMIN") {
      console.log(`ℹ️  User "${email}" is already an ADMIN`);
      process.exit(0);
    }

    // Promote to admin
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });

    console.log(`✅ User "${email}" (${user.name}) has been promoted to ADMIN`);
    console.log(`   They will need to sign out and sign in again for the changes to take effect.`);
  } catch (error) {
    console.error("❌ Error promoting user to admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: pnpm tsx scripts/maintenance/promote-admin.ts <email>");
  process.exit(1);
}

promoteToAdmin(email);
