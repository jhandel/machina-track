# Database Management

This project uses Prisma with SQLite for database management. The database connection is automatically initialized with schema deployment when the application starts.

## Automatic Schema Deployment

The Prisma connection in this project (`src/lib/database/prisma-client.ts`) automatically:

1. **Creates database directory** if it doesn't exist
2. **Checks if database needs initialization** by attempting to connect and query
3. **Deploys schema automatically** using appropriate strategy:
   - **Development**: Uses `prisma db push` for schema synchronization
   - **Production**: Uses `prisma migrate deploy` if migration files exist
4. **Provides singleton connection** that can be imported throughout the application

## Quick Setup

```bash
# Install dependencies and generate Prisma client
npm install

# Setup database (manual - optional, as it happens automatically)
npm run db:setup

# Start development server (database will auto-initialize)
npm run dev
```

## Available Database Commands

```bash
# Generate Prisma client (auto-runs after npm install)
npm run db:generate

# Push schema changes to database
npm run db:push

# Reset database with current schema
npm run db:reset

# Open Prisma Studio for database inspection
npm run db:studio

# Create and apply migrations (for production)
npm run db:migrate

# Deploy migrations (for production)
npm run db:deploy

# Setup database manually
npm run db:setup
```

## Usage in Code

Import the centralized Prisma client:

```typescript
import { getPrismaClient } from '@/lib/database/prisma-client';

export class MyRepository {
  async findAll() {
    const prisma = await getPrismaClient();
    return await prisma.myModel.findMany();
  }
}
```

The `getPrismaClient()` function:
- Returns a singleton Prisma client instance
- Automatically initializes database on first call
- Handles schema deployment if needed
- Provides proper error handling and logging

## Database Schema Location

- **Schema**: `prisma/schema.prisma`
- **Database**: `data/machina-track.db` (SQLite)
- **Generated Client**: `src/generated/prisma/`

## Environment Configuration

Set your database URL in `.env`:

```env
DATABASE_URL="file:./data/machina-track.db"
```

## Production Deployment

For production deployments:

1. **Set NODE_ENV=production**
2. **Use migrations** instead of db push:
   ```bash
   npm run db:migrate
   npm run db:deploy
   ```
3. **Ensure DATABASE_URL** points to your production database

## Error Handling

The automatic schema deployment includes:
- ✅ Graceful error handling
- ✅ Fallback to existing schema if deployment fails
- ✅ Detailed logging with emojis for easy debugging
- ✅ Environment-specific deployment strategies

## Benefits

This setup provides:
- 🚀 **Zero-configuration** database initialization
- 🔄 **Automatic schema synchronization**
- 🏗️ **Environment-aware deployment strategies**
- 🔌 **Singleton connection management**
- 🛡️ **Error resilience and graceful fallbacks**
- 📝 **Comprehensive logging and debugging**
