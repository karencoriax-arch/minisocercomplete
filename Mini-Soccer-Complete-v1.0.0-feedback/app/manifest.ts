import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mini Soccer Complete",
    short_name: "Mini Soccer",
    description: "Fútbol arcade 4v4, 5v5 y 6v6 con controles táctiles, torneos y temporada.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#030705",
    theme_color: "#071008",
    orientation: "landscape",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
