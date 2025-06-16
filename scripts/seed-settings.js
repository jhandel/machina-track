const { getPrismaClient } = require('../src/lib/database/prisma-client.ts');

async function seedSettings() {
  console.log('🌱 Seeding settings data...');
  
  try {
    const prisma = await getPrismaClient();
    
    // Seed locations
    const locations = ["Shop Floor A", "Shop Floor B", "Storage Room 1", "Inspection Lab"];
    console.log('📍 Seeding locations...');
    for (const location of locations) {
      await prisma.locations.create({
        data: {
          id: crypto.randomUUID(),
          name: location,
        },
      });
    }
    console.log(`✅ Created ${locations.length} locations`);
    
    // Seed manufacturers
    const manufacturers = ["Haas", "DMG Mori", "Okuma", "Mazak", "Mitutoyo", "Starrett"];
    console.log('🏭 Seeding manufacturers...');
    for (const manufacturer of manufacturers) {
      await prisma.manufacturers.create({
        data: {
          id: crypto.randomUUID(),
          name: manufacturer,
        },
      });
    }
    console.log(`✅ Created ${manufacturers.length} manufacturers`);
    
    // Seed metrology tool types
    const metrologyTypes = ["Caliper", "Micrometer", "Height Gauge", "Surface Plate", "Gauge Blocks"];
    console.log('📏 Seeding metrology tool types...');
    for (const type of metrologyTypes) {
      await prisma.metrology_tool_types.create({
        data: {
          id: crypto.randomUUID(),
          name: type,
        },
      });
    }
    console.log(`✅ Created ${metrologyTypes.length} metrology tool types`);
    
    // Seed cutting tool materials
    const materials = ["HSS", "Carbide", "Cobalt", "PCD"];
    console.log('🔧 Seeding cutting tool materials...');
    for (const material of materials) {
      await prisma.cutting_tool_materials.create({
        data: {
          id: crypto.randomUUID(),
          name: material,
        },
      });
    }
    console.log(`✅ Created ${materials.length} cutting tool materials`);
    
    // Seed cutting tool types
    const cuttingTypes = ["End Mill", "Drill Bit", "Lathe Insert", "Reamer", "Tap"];
    console.log('✂️ Seeding cutting tool types...');
    for (const type of cuttingTypes) {
      await prisma.cutting_tool_types.create({
        data: {
          id: crypto.randomUUID(),
          name: type,
        },
      });
    }
    console.log(`✅ Created ${cuttingTypes.length} cutting tool types`);
    
    console.log('🎉 Settings seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    throw error;
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedSettings()
    .then(() => {
      console.log('✅ Settings seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Settings seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedSettings };
