"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// This is a redirect page to support a common URL pattern
export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // The actual form is at the parent route
    router.replace("../service-log");
  }, [router]);

  return <div>Redirecting...</div>;
}
