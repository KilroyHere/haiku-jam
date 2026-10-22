import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Morrow — Collaborative Poetry",
    short_name: "Morrow",
    description: "Three voices, one small poem.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F7F2E8",
    theme_color: "#F7F2E8",
    categories: ["lifestyle", "social", "books"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Start a jam", short_name: "Start", url: "/compose" },
      { name: "Find an open jam", short_name: "Join", url: "/deck" },
    ],
  };
}
