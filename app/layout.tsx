import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
})

export const metadata: Metadata = {
    title: "SoCal Solar Pro — Leads",
    description: "Lead management dashboard for SoCal Solar Pro",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "SSP Leads",
    },
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: "#068DD4",
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.variable}>{children}</body>
        </html>
    )
}
