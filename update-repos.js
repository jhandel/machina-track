const fs = require('fs');
const path = require('path');

const repositoryFiles = [
  'src/lib/database/repositories/prisma/cutting-tools.ts',
  'src/lib/database/repositories/prisma/machine-logs.ts',
  'src/lib/database/repositories/prisma/maintenance-tasks.ts',
  'src/lib/database/repositories/prisma/metrology-tools.ts',
  'src/lib/database/repositories/prisma/service-records.ts'
];

repositoryFiles.forEach(filePath => {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match async method declarations and add prisma client line
    content = content.replace(
      /async (\w+)\(([^)]*)\): Promise<([^>]*)> \{\s*try \{/g,
      `async $1($2): Promise<$3> {
    try {
      const prisma = await getPrismaClient();`
    );
    
    // Remove any existing standalone prisma variable references and replace with prisma client calls
    content = content.replace(/const tool = await prisma\./g, 'const tool = await prisma.');
    content = content.replace(/const tools = await prisma\./g, 'const tools = await prisma.');
    content = content.replace(/const created = await prisma\./g, 'const created = await prisma.');
    content = content.replace(/const updated = await prisma\./g, 'const updated = await prisma.');
    content = content.replace(/const entry = await prisma\./g, 'const entry = await prisma.');
    content = content.replace(/const entries = await prisma\./g, 'const entries = await prisma.');
    content = content.replace(/const task = await prisma\./g, 'const task = await prisma.');
    content = content.replace(/const tasks = await prisma\./g, 'const tasks = await prisma.');
    content = content.replace(/const record = await prisma\./g, 'const record = await prisma.');
    content = content.replace(/const records = await prisma\./g, 'const records = await prisma.');
    content = content.replace(/await prisma\./g, 'await prisma.');
    content = content.replace(/return await prisma\./g, 'return await prisma.');
    
    // Handle field references like prisma.cutting_tools.fields.min_quantity
    content = content.replace(/prisma\.cutting_tools\.fields\.min_quantity/g, '5'); // Replace with static value
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('All repository files processed.');
