/*
  Renaming cutting_tools tables to consumables tables
*/

-- Rename tables to preserve data
ALTER TABLE cutting_tools RENAME TO consumables;
ALTER TABLE cutting_tool_materials RENAME TO consumable_materials;
ALTER TABLE cutting_tool_types RENAME TO consumable_types;

-- Update indexes
DROP INDEX IF EXISTS idx_cutting_tools_quantity;
DROP INDEX IF EXISTS idx_cutting_tools_location;

CREATE INDEX idx_consumables_quantity ON consumables(quantity);
CREATE INDEX idx_consumables_location ON consumables(location);

-- Create unique constraints for new tables
CREATE UNIQUE INDEX consumable_materials_name_key ON consumable_materials(name);
CREATE UNIQUE INDEX consumable_types_name_key ON consumable_types(name);
