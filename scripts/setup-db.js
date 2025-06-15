#!/usr/bin/env node

/**
 * Database setup script for Machina Track
 * This script initializes the database and ensures the schema is up to date
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function setupDatabase() {
  console.log('🚀 Setting up Machina Track database...\n');

  try {
    // Check if .env file exists
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log('⚠️  .env file not found. Creating one with default settings...');
      fs.writeFileSync(envPath, 'DATABASE_URL="file:./data/machina-track.db"\n');
      console.log('✅ Created .env file with default DATABASE_URL\n');
    }

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory\n');
    }

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated\n');

    // Push schema to database
    console.log('📋 Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Schema pushed to database\n');

    // Test connection
    console.log('🔍 Testing database connection...');
    const { getPrismaClient } = require('./src/lib/database/prisma-client.ts');
    const prisma = await getPrismaClient();
    const count = await prisma.equipment.count();
    console.log(`✅ Database connection successful! Equipment count: ${count}\n`);

    await prisma.$disconnect();

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📖 Available commands:');
    console.log('  npm run db:studio    - Open Prisma Studio');
    console.log('  npm run db:reset     - Reset database with schema');
    console.log('  npm run db:push      - Push schema changes');
    console.log('  npm run dev          - Start development server');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
