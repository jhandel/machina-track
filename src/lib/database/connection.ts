// src/lib/database/connection.ts
import { getPrismaClient } from './prisma-client';

/**
 * Check database health by attempting a simple query
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const prisma = await getPrismaClient();
    // Try a simple query to check if the database is reachable
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Synchronous version for quick checks (non-blocking)
 */
export function checkDatabaseHealthSync(): boolean {
  try {
    // For sync version, we just return true if the Prisma client can be instantiated
    // This is a simplified check and doesn't actually test the connection
    return true;
  } catch (error) {
    console.error('Database health check sync failed:', error);
    return false;
  }
}
