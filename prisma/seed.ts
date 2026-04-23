import "dotenv/config";
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from 'node:url';
import { seedDealDashboardsMenu } from "./seed-deal-dashboards-menu";
import { seedMenuItems } from "./seed-menu-items";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Remove deprecated Sales menu (sidebar is DB-driven)
  await prisma.menuItem.deleteMany({
    where: { href: "/dashboard/sales" },
  });

  // Ensure menu item exists (idempotent)
  await seedDealDashboardsMenu(prisma);
  await seedMenuItems();

  // Create a test user if it doesn't exist
  const testUser = await prisma.user.upsert({
    where: { email: "saddam.hussainus11@gmail.com" },
    update: {},
    create: {
      name: "Saddam Hussain",
      email: "saddam.hussainus11@gmail.com",
      country: "Pakistan",
      role: "admin",
      image: "/images/avatars/01.png",
      status: "active",
      plan_name: "Basic",
    }
  });

  // Seed note labels
  const noteLabelsData = [
    { title: "Family", color: "bg-pink-500" },
    { title: "Tasks", color: "bg-purple-500" },
    { title: "Personal", color: "bg-green-500" },
    { title: "Meetings", color: "bg-cyan-500" },
    { title: "Shopping", color: "bg-teal-500" },
    { title: "Planning", color: "bg-orange-500" },
    { title: "Travel", color: "bg-blue-500" }
  ];

  for (const label of noteLabelsData) {
    await prisma.noteLabel.upsert({
      where: { id: noteLabelsData.indexOf(label) + 1 },
      update: {
        title: label.title,
        color: label.color,
      },
      create: {
        title: label.title,
        color: label.color,
        userId: testUser.id,
      }
    });
  }

}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })