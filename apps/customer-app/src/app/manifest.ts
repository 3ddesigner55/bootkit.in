import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BootKiT - Fast Local Delivery",
    short_name: "BootKiT",
    description:
      "Groceries and daily essentials delivered quickly in selected local areas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f7f5",
    theme_color: "#165c3a",
    categories: [
      "shopping",
      "food",
      "lifestyle",
    ],
    lang: "en-IN",
    dir: "ltr",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Shop products",
        short_name: "Shop",
        description: "Browse BootKiT products",
        url: "/",
        icons: [
          {
            src: "/icon",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      {
        name: "My cart",
        short_name: "Cart",
        description: "Open your BootKiT cart",
        url: "/cart",
        icons: [
          {
            src: "/icon",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      {
        name: "My orders",
        short_name: "Orders",
        description: "View your BootKiT orders",
        url: "/orders",
        icons: [
          {
            src: "/icon",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    ],
  };
}