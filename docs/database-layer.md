# MachinaTrack Database Layer

## Overview

This document describes the lightweight SQLite database layer implemented for MachinaTrack, designed to be easily swappable with other database systems in the future.

## Architecture

The database layer follows a **Repository Pattern** with **Unit of Work** implementation, providing clean separation between business logic and data access.

### Key Components

1. **Database Layer** (`src/lib/database/`)
   - `connection.ts` - Database connection management
   - `schema.sql` - SQLite schema definition
   - `interfaces.ts` - Repository interfaces and error types
   - `repositories/` - Repository implementations

2. **API Layer** (`src/app/api/`)
   - RESTful API endpoints for each entity
   - Input validation using Zod
   - Consistent error handling

3. **Service Layer** (`src/services/`)
   - High-level business logic
   - Type-safe client for frontend consumption
   - Abstracted from direct API calls

## Database Schema

The SQLite database includes the following tables:

- `equipment` - Machine/equipment tracking
- `metrology_tools` - Metrology tool management
- `calibration_logs` - Calibration history
- `cutting_tools` - Tool inventory
- `maintenance_tasks` - Maintenance scheduling
- `maintenance_parts` - Parts used in maintenance
- `service_records` - Service history
- `service_record_attachments` - File attachments
- `machine_log_entries` - Machine logs for AI analysis

## Getting Started

### 1. Install Dependencies

The required dependencies are already installed:
- `better-sqlite3` - SQLite database driver
- `@types/better-sqlite3` - TypeScript definitions
- `uuid` - UUID generation
- `@types/uuid` - TypeScript definitions

### 2. Database Initialization

The database will be automatically created when first accessed. The schema is applied automatically.

Database file location: `./data/machina-track.db`

### 3. Environment Variables

No additional environment variables are required for SQLite. The database file is created locally.

### 4. API Usage

#### Equipment Management

```typescript
// Get all equipment
GET /api/equipment?limit=50&offset=0

// Get equipment by status
GET /api/equipment?status=operational

// Create equipment
POST /api/equipment
{
  "name": "CNC Mill #1",
  "model": "Haas VF-2",
  "serialNumber": "12345",
  "location": "Shop Floor A",
  "status": "operational"
}

// Update equipment
PUT /api/equipment/[id]
{
  "status": "maintenance"
}

// Delete equipment
DELETE /api/equipment/[id]
```

#### Maintenance Tasks

```typescript
// Get maintenance tasks
GET /api/maintenance-tasks?status=pending

// Get upcoming tasks (next 30 days)
GET /api/maintenance-tasks?upcoming=30

// Get overdue tasks
GET /api/maintenance-tasks?overdue=true

// Create maintenance task
POST /api/maintenance-tasks
{
  "equipmentId": "eq-123",
  "description": "Lubricate spindle",
  "frequencyDays": 30,
  "assignedTo": "Maintenance Team"
}
```

#### Dashboard Data

```typescript
// Get dashboard summary
GET /api/dashboard

Response:
{
  "success": true,
  "data": {
    "summary": {
      "upcomingMaintenanceCount": 5,
      "lowInventoryCount": 2,
      "overdueCalibrationsCount": 1
    },
    "recentActivity": [...],
    "equipmentStatusCounts": {...},
    "maintenanceStatusCounts": {...}
  }
}
```

### 5. Frontend Service Usage

```typescript
import { equipmentService, maintenanceService, dashboardService } from '@/services';

// Equipment operations
const equipment = await equipmentService.getAll();
const machine = await equipmentService.getById('eq-123');
const newEquipment = await equipmentService.create({...});

// Maintenance operations
const tasks = await maintenanceService.getUpcoming(7);
const overdueTasks = await maintenanceService.getOverdue();
await maintenanceService.markCompleted('task-123');

// Dashboard data
const dashboardData = await dashboardService.getDashboardData();
const summary = await dashboardService.getSummary();
```

## Database Swapping Guide

To replace SQLite with another database (PostgreSQL, MySQL, etc.):

### 1. Create New Repository Implementations

```typescript
// Example: PostgreSQL implementation
export class PostgresEquipmentRepository implements EquipmentRepository {
  constructor(private pool: Pool) {}
  
  async findById(id: string): Promise<Equipment | null> {
    // PostgreSQL-specific implementation
  }
  
  // ... other methods
}
```

### 2. Update Unit of Work

```typescript
export class PostgresUnitOfWork implements UnitOfWork {
  constructor() {
    // Initialize PostgreSQL repositories
    this.equipment = new PostgresEquipmentRepository(this.pool);
    // ... other repositories
  }
}
```

### 3. Update Connection Management

```typescript
// Create new connection module for PostgreSQL
export function getPostgresDatabase(): Pool {
  // PostgreSQL connection logic
}
```

### 4. Environment Configuration

Add database configuration to environment variables:

```env
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@localhost:5432/machina_track
```

### 5. Factory Pattern (Optional)

```typescript
export function createUnitOfWork(): UnitOfWork {
  const dbType = process.env.DATABASE_TYPE || 'sqlite';
  
  switch (dbType) {
    case 'postgresql':
      return new PostgresUnitOfWork();
    case 'mysql':
      return new MySQLUnitOfWork();
    default:
      return new SqliteUnitOfWork();
  }
}
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/equipment` | List equipment with filtering |
| POST | `/api/equipment` | Create new equipment |
| GET | `/api/equipment/[id]` | Get equipment by ID |
| PUT | `/api/equipment/[id]` | Update equipment |
| DELETE | `/api/equipment/[id]` | Delete equipment |
| GET | `/api/maintenance-tasks` | List maintenance tasks |
| POST | `/api/maintenance-tasks` | Create maintenance task |
| GET | `/api/maintenance-tasks/[id]` | Get task by ID |
| PUT | `/api/maintenance-tasks/[id]` | Update task |
| DELETE | `/api/maintenance-tasks/[id]` | Delete task |
| GET | `/api/dashboard` | Get dashboard data |
| GET | `/api/health` | Health check |

## Error Handling

The API uses consistent error response format:

```typescript
{
  "success": false,
  "error": "Error message",
  "details": [...] // For validation errors
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

## Performance Considerations

### SQLite Optimizations
- WAL mode enabled for better concurrency
- Proper indexes on frequently queried columns
- Foreign key constraints enabled
- Connection pooling via singleton pattern

### Pagination
- All list endpoints support `limit` and `offset` parameters
- Default limit is 50 items
- Response includes pagination metadata

### Caching
Ready for caching layer implementation:
- Repository pattern allows easy caching injection
- Service layer can implement caching logic
- API responses are structured for cache-friendly patterns

## Testing

```bash
# Run type checking
npm run typecheck

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/equipment
```

## Security Considerations

1. **Input Validation** - All inputs validated with Zod schemas
2. **SQL Injection** - Prevented by using parameterized queries
3. **Error Information** - Sanitized error messages in production
4. **File Permissions** - Database file should have restricted access

## Future Enhancements

1. **Authentication** - Add JWT/session-based auth
2. **Audit Logging** - Track all database changes
3. **Soft Deletes** - Implement soft delete pattern
4. **Data Migration** - Add migration system for schema changes
5. **Connection Pooling** - For databases that support it
6. **Read Replicas** - For high-traffic scenarios
7. **Caching Layer** - Redis/in-memory caching
8. **Full-text Search** - Enhanced search capabilities
