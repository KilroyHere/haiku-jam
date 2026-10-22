import type { Metadata } from "next";

import { DeckScreen } from "@/components/deck-screen";

export const metadata: Metadata = {
  title: "Open jams",
  description: "Find a poem waiting for its next line.",
};

export default function DeckPage() {
  return <DeckScreen />;
}
