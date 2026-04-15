/**
 * Test script to diagnose login issues
 * Run with: npx tsx test-login.ts
 */

import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function testLogin() {
  try {
    console.log('=== Login Diagnostic Tool ===\n');

    // Get email from user
    rl.question('Enter email to test: ', async (email) => {
      const trimmedEmail = email.trim();

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: trimmedEmail },
        include: { company: true, branch: true },
      });

      if (!user) {
        console.log('\n❌ User not found in database');
        console.log(`   Email searched: ${trimmedEmail}`);
        
        // List all users
        const allUsers = await prisma.user.findMany({
          select: { id: true, email: true, name: true, password: true },
          take: 10,
        });
        console.log('\n📋 Available users in database:');
        allUsers.forEach(u => {
          console.log(`   - ${u.email} (ID: ${u.id}, Name: ${u.name}, Has Password: ${!!u.password})`);
        });
        rl.close();
        await prisma.$disconnect();
        return;
      }

      console.log('\n✅ User found!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'N/A'}`);

      if (!user.password) {
        console.log('\n❌ User has no password set!');
        console.log('   You need to set a password for this user.');
        rl.close();
        await prisma.$disconnect();
        return;
      }

      // Test password
      rl.question('\nEnter password to test: ', async (password) => {
        const isValid = await bcrypt.compare(password, user.password!);
        
        if (isValid) {
          console.log('\n✅ Password is CORRECT!');
          console.log('   The login should work. Check:');
          console.log('   1. Backend server is running');
          console.log('   2. API URL is correct (check NEXT_PUBLIC_API_URL)');
          console.log('   3. CORS is configured properly');
        } else {
          console.log('\n❌ Password is INCORRECT!');
          console.log('   The password you entered does not match the stored hash.');
        }

        rl.close();
        await prisma.$disconnect();
      });
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    rl.close();
    await prisma.$disconnect();
  }
}

testLogin();














































































