"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { AbilityProvider } from "@/components/providers/AbilityProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AbilityProvider>{children}</AbilityProvider>
    </SessionProvider>
  );
}
