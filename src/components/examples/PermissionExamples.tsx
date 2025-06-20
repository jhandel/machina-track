// Example of how to use Casl.js permissions in your components

import { Can, usePermission } from "@/components/providers/AbilityProvider";
import { Button } from "@/components/ui/button";

export function EquipmentActions() {
  const { can } = usePermission();

  return (
    <div className="flex gap-2">
      {/* Always visible read button */}
      <Button variant="outline">View Equipment</Button>

      {/* Conditional rendering with Can component */}
      <Can action="create" subject="Equipment">
        <Button>Add New Equipment</Button>
      </Can>

      <Can action="update" subject="Equipment">
        <Button variant="secondary">Edit Equipment</Button>
      </Can>

      <Can action="delete" subject="Equipment">
        <Button variant="destructive">Delete Equipment</Button>
      </Can>

      {/* Using the can function directly */}
      {can("calibrate", "Metrology") && (
        <Button variant="outline">Calibrate Tools</Button>
      )}
    </div>
  );
}

// Example of page-level permission checking
export function EquipmentPage() {
  const { can } = usePermission();

  // Redirect or show error if user can't read equipment
  if (!can("read", "Equipment")) {
    return <div>You don't have permission to view equipment.</div>;
  }

  return (
    <div>
      <h1>Equipment Management</h1>
      <EquipmentActions />
      {/* Your equipment list/table here */}
    </div>
  );
}
