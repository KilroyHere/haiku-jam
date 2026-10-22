import type { Metadata } from "next";
import { Suspense } from "react";

import { ComposeScreen } from "@/components/compose-screen";

export const metadata: Metadata = {
  title: "Write a line",
  description: "Begin a jam or carry an open poem forward.",
};

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="screen">
          <div className="skeleton skeleton--deck" />
        </div>
      }
    >
      <ComposeScreen />
    </Suspense>
  );
}
