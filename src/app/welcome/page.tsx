import type { Metadata } from "next";

import { WelcomeScreen } from "@/components/welcome-screen";

export const metadata: Metadata = {
  title: "Join",
  description: "Create a Morrow profile or sign in to add your line.",
};

export default function WelcomePage() {
  return <WelcomeScreen />;
}
