"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      if (status === "loading") {
        return; // Still loading session
      }

      if (status === "authenticated") {
        router.push("/dashboard");
        return;
      }

      // User is not authenticated, check if setup is needed
      try {
        const response = await fetch("/api/auth/setup-check");
        const data = await response.json();

        if (data.isFirstUser) {
          console.log("Redirecting to setup...");
          router.push("/setup");
        } else {
          console.log("Redirecting to signin...");
          router.push("/auth/signin");
        }
      } catch (error) {
        console.error("Setup check failed:", error);
        router.push("/auth/signin");
      } finally {
        setIsChecking(false);
      }
    };

    handleRedirect();
  }, [status, router]);

  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return null; // Should not reach here as we redirect
}
