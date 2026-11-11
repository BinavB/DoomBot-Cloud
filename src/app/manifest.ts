import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DOOMBOT",
    short_name: "DOOMBOT",
    description: "A personal proactive AI agent",
    id: "/",
    start_url: "/",
    scope: "/",
    orientation: "portrait",
    display: "standalone",
    background_color: "#0d1210",
    theme_color: "#0d1210",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
