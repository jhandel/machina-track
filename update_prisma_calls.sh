#!/bin/bash

# Script to update all Prisma repository files to use getPrismaClient()

files=(
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/cutting-tools.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/machine-logs.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/maintenance-tasks.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/metrology-tools.ts"
  "/Users/jhandel/Downloads/download/src/lib/database/repositories/prisma/service-records.ts"
)

echo "Updating remaining Prisma repository files..."

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Add const prisma = await getPrismaClient(); at the beginning of each async method
  sed -i '' 's/async \([^(]*\)([^)]*): Promise<[^>]*> {/async \1&\n    const prisma = await getPrismaClient();/g' "$file"
  
  # Clean up any double declarations (if they exist)
  sed -i '' '/const prisma = await getPrismaClient();.*const prisma = await getPrismaClient();/s/const prisma = await getPrismaClient();//' "$file"
  
done

echo "Repository file updates completed."
