import type React from "react"
import type { Metadata, Viewport } from "next"
import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import "./globals.css"
import Toaster from "@/components/Toaster"
import RoleDebugger from "@/components/RoleDebugger"
import { ThemeProvider } from "@/components/ThemeProvider"

export const metadata: Metadata = {
  title: "ClinicalScribe",
  description: "AI-powered clinical documentation",
  generator: 'v0.dev',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClinicalScribe",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">
        <ThemeProvider>
          <Navigation />
          {children}
          <Footer />
          <Toaster />
          {process.env.NODE_ENV === "development" && <RoleDebugger />}
        </ThemeProvider>
      </body>
    </html>
  )
}
