import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mini Soccer Complete",
    short_name: "Mini Soccer",
    description: "Fútbol arcade móvil 3v3 y 4v4 con joystick analógico, HUD configurable, torneos y temporada.",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    background_color: "#030705",
    theme_color: "#071008",
    orientation: "landscape",
    categories: ["games", "sports"],
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
