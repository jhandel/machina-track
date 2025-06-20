"use client";

import React, { createContext, useContext } from "react";
import { AppAbility, defineAbilitiesFor, UserRole } from "@/lib/abilities";
import { useSession } from "next-auth/react";

// Create the Ability Context
const AbilityContext = createContext<AppAbility | null>(null);

// Provider component
export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  // Get user role from session, default to VIEWER
  const userRole = (session?.user as any)?.role || UserRole.VIEWER;

  // Create abilities based on user role
  const ability = defineAbilitiesFor(userRole);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}

// Hook to use abilities in components
export function useAbility(): AppAbility {
  const ability = useContext(AbilityContext);
  if (!ability) {
    // Return a default ability for viewers if context is not available
    return defineAbilitiesFor(UserRole.VIEWER);
  }
  return ability;
}

// Helper hook for checking permissions
export function usePermission() {
  const ability = useAbility();

  return {
    can: ability.can.bind(ability),
    cannot: ability.cannot.bind(ability),
    ability,
  };
}

// Simple Can component for conditional rendering
export function Can({
  action,
  subject,
  children,
}: {
  action: string;
  subject: string;
  children: React.ReactNode;
}) {
  const ability = useAbility();

  if (ability.can(action as any, subject as any)) {
    return <>{children}</>;
  }

  return null;
}
