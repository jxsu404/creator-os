import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Creator OS",
    short_name: "Creator OS",
    description:
      "Compañero creativo: de idea vaga a guía lista para grabar.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#6C3EF4",
    orientation: "portrait-primary",
    lang: "es",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
