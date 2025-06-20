"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function SetupGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch("/api/auth/setup-check");
        const data = await response.json();

        if (data.isFirstUser) {
          setIsFirstUser(true);
          router.push("/setup");
        } else if (status === "unauthenticated") {
          router.push("/auth/signin");
        }
      } catch (error) {
        console.error("Setup check failed:", error);
        // Fallback to login page
        if (status === "unauthenticated") {
          router.push("/auth/signin");
        }
      } finally {
        setIsCheckingSetup(false);
      }
    };

    if (status !== "loading") {
      checkSetup();
    }
  }, [status, router]);

  if (status === "loading" || isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isFirstUser) {
    return null; // Redirecting to setup
  }

  if (status === "unauthenticated") {
    return null; // Redirecting to signin
  }

  return <>{children}</>;
}
