/**
 * Quick script to check if a user exists and has a password
 * Usage: npx tsx check-user.ts <email>
 */

import { prisma } from './lib/prisma';

async function checkUser() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: npx tsx check-user.ts <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        mustChangePassword: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      console.log('\nAvailable users:');
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true },
        take: 10,
      });
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name})`));
    } else {
      console.log(`✅ User found: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Has Password: ${user.password ? '✅ Yes' : '❌ No'}`);
      console.log(`   Must Change Password: ${user.mustChangePassword}`);
      
      if (!user.password) {
        console.log('\n⚠️  This user has no password set!');
        console.log('   You need to set a password using:');
        console.log(`   POST /users/set-password/${user.id}`);
        console.log('   Body: { "password": "your-password" }');
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();














































































