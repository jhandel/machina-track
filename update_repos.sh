#!/bin/bash

# List of repository files to update
files=(
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/calibration-logs.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/cutting-tools.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/dashboard.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/machine-logs.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/maintenance-tasks.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/metrology-tools.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/service-records.ts"
)

echo "Updating Prisma repository files..."

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Replace PrismaClient import and const prisma line
  sed -i '' 's/import { PrismaClient } from .*$/import { getPrismaClient } from "..\/..\/prisma-client";/' "$file"
  sed -i '' '/^const prisma = new PrismaClient/d' "$file"
  
  # Replace all prisma. calls with const prisma = await getPrismaClient(); prisma.
  # This is a more complex replacement, so we'll use a different approach
  
done

echo "Basic replacements completed. Manual updates may be needed for await getPrismaClient() calls."
