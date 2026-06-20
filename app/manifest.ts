import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "SoCal Solar Pro Leads",
        short_name: "SSP Leads",
        description: "Lead management dashboard for SoCal Solar Pro",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#068DD4",
        icons: [
            {
                src: "/apple-icon",
                sizes: "180x180",
                type: "image/png",
                purpose: "any",
            },
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
        ],
    }
}
