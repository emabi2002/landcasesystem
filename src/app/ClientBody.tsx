"use client";

import { useEffect } from "react";
import { HelpProvider, HelpButton, HelpDrawer, WelcomeTour } from "@/components/help";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  return (
    <div className="antialiased">
      <HelpProvider>
        {children}
        <HelpButton />
        <HelpDrawer />
        <WelcomeTour />
      </HelpProvider>
    </div>
  );
}
