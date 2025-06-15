import { PrismaClient } from '@/generated/prisma';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Global Prisma client instance for singleton pattern
 */
declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client with automatic schema deployment and migration
 */
class PrismaConnection {
  private static instance: PrismaClient | null = null;
  private static isInitialized = false;

  /**
   * Get the singleton Prisma client instance
   */
  static async getInstance(): Promise<PrismaClient> {
    if (!this.instance) {
      this.instance = globalThis.__prisma || new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty',
      });
      
      if (process.env.NODE_ENV !== 'production') {
        globalThis.__prisma = this.instance;
      }
    }

    // Initialize database if not already done
    if (!this.isInitialized) {
      await this.initializeDatabase();
      this.isInitialized = true;
    }

    return this.instance;
  }

  /**
   * Initialize database with schema deployment and migrations
   */
  private static async initializeDatabase(): Promise<void> {
    try {
      console.log('🔄 Initializing Prisma database...');
      
      // Ensure database directory exists
      await this.ensureDatabaseDirectory();

      // Check if database needs initialization
      const needsInit = await this.checkDatabaseNeedsInit();
      
      if (needsInit) {
        console.log('📋 Database requires initialization or migration...');
        await this.deploySchema();
      } else {
        console.log('✅ Database is up to date.');
      }

      // Connect to database
      await this.instance!.$connect();
      console.log('🎉 Prisma database initialized successfully.');
      
    } catch (error) {
      console.error('❌ Failed to initialize Prisma database:', error);
      throw error;
    }
  }

  /**
   * Ensure database directory exists
   */
  private static async ensureDatabaseDirectory(): Promise<void> {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.startsWith('file:')) {
      const dbPath = dbUrl.replace('file:', '');
      const dbDir = path.dirname(path.resolve(dbPath));
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`📁 Created database directory: ${dbDir}`);
      }
    }
  }

  /**
   * Check if database needs initialization or migration
   */
  private static async checkDatabaseNeedsInit(): Promise<boolean> {
    try {
      // Try to connect and run a simple query
      await this.instance!.$connect();
      
      // Check if any table exists by querying one of the models
      await this.instance!.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' LIMIT 1`;
      
      return false; // Database is accessible and has tables
    } catch (error) {
      // If we can't query the database, it likely needs initialization
      console.log('🔧 Database needs initialization:', (error as Error).message);
      return true;
    }
  }

  /**
   * Deploy schema using appropriate strategy based on environment
   */
  private static async deploySchema(): Promise<void> {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const hasNodeModules = fs.existsSync(path.resolve(process.cwd(), 'node_modules'));
      
      if (isProduction && this.migrationFilesExist()) {
        // In production with migrations, use migrate deploy
        console.log('🚀 Running Prisma migrate deploy for production...');
        await this.runPrismaCommand('migrate deploy');
      } else if (hasNodeModules) {
        // In development or when migrations don't exist, use db push
        console.log('🔨 Running Prisma db push for development...');
        await this.runPrismaCommand('db push --accept-data-loss');
      } else {
        console.log('⚠️  No node_modules found, skipping automatic schema deployment');
        console.log('💡 Please run "npm install" and then "npm run db:push" manually');
      }
      
      console.log('✅ Schema deployment completed successfully.');
    } catch (error) {
      console.error('❌ Schema deployment failed:', error);
      // Don't throw here - allow the application to continue with existing schema
      console.log('🔄 Continuing with existing database schema...');
    }
  }

  /**
   * Check if migration files exist
   */
  private static migrationFilesExist(): boolean {
    const migrationsPath = path.resolve(process.cwd(), 'prisma', 'migrations');
    return fs.existsSync(migrationsPath) && fs.readdirSync(migrationsPath).length > 0;
  }

  /**
   * Run a Prisma CLI command
   */
  private static async runPrismaCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = command.split(' ');
      const prismaPath = path.resolve(process.cwd(), 'node_modules/.bin/prisma');
      
      // Check if prisma CLI exists
      if (!fs.existsSync(prismaPath)) {
        reject(new Error('Prisma CLI not found. Please run "npm install" first.'));
        return;
      }

      const child = spawn(prismaPath, args, {
        stdio: 'pipe',
        env: { ...process.env },
        cwd: process.cwd(),
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Prisma ${command} completed:`, stdout);
          resolve();
        } else {
          console.error(`❌ Prisma ${command} failed:`, stderr);
          reject(new Error(`Prisma ${command} failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        console.error(`❌ Failed to run Prisma ${command}:`, error);
        reject(error);
      });
    });
  }

  /**
   * Disconnect from database
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
      this.isInitialized = false;
      if (globalThis.__prisma) {
        globalThis.__prisma = undefined;
      }
    }
  }

  /**
   * Reset database connection (for testing purposes)
   */
  static async reset(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
    }
    this.instance = null;
    this.isInitialized = false;
    if (globalThis.__prisma) {
      globalThis.__prisma = undefined;
    }
  }

  /**
   * Force database reinitialization
   */
  static async reinitialize(): Promise<void> {
    this.isInitialized = false;
    await this.getInstance();
  }
}

/**
 * Get the singleton Prisma client instance
 * This is the main export that should be used throughout the application
 */
export const getPrismaClient = () => PrismaConnection.getInstance();

/**
 * Disconnect from database (useful for cleanup)
 */
export const disconnectPrisma = () => PrismaConnection.disconnect();

/**
 * Reset database connection (useful for testing)
 */
export const resetPrismaConnection = () => PrismaConnection.reset();

/**
 * Force database reinitialization (useful when schema changes)
 */
export const reinitializePrisma = () => PrismaConnection.reinitialize();

/**
 * Default export for convenience
 */
export default () => PrismaConnection.getInstance();
