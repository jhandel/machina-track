#!/usr/bin/env node

const { getPrismaClient } = require('./src/lib/database/prisma-client.ts');

async function testPrismaConnection() {
  try {
    console.log('Testing Prisma connection and schema deployment...');
    
    // This will automatically initialize the database and deploy schema if needed
    const prisma = await getPrismaClient();
    
    // Test a simple query
    const equipmentCount = await prisma.equipment.count();
    console.log(`Equipment count: ${equipmentCount}`);
    
    console.log('✅ Prisma connection test successful!');
    
    // Close connection
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Prisma connection test failed:', error);
    process.exit(1);
  }
}

testPrismaConnection();
