import type { Metadata } from "next";

import { JamDetailScreen } from "@/components/jam-detail-screen";
import { getPublicJam } from "@/lib/public-jam";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const jam = await getPublicJam(id);
  const excerpt = jam?.lines.map((line) => line.text).join(" / ");
  return {
    title: jam ? "A poem in three voices" : "Poem",
    description: excerpt || "A collaborative poem from Morrow.",
    alternates: { canonical: `/jam/${id}` },
    openGraph: {
      type: "article",
      title: "A poem in three voices · Morrow",
      description: excerpt || "A collaborative poem from Morrow.",
      url: `/jam/${id}`,
    },
  };
}

export default async function JamPage({ params }: PageProps) {
  const { id } = await params;
  const jam = await getPublicJam(id);
  return <JamDetailScreen jamId={id} initialJam={jam} />;
}
