import type React from "react"
import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import "./globals.css"
import Toaster from "@/components/Toaster"
import RoleDebugger from "@/components/RoleDebugger"

export const metadata: Metadata = {
  title: "ClinicalScribe",
  description: "AI-powered clinical documentation",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Navigation />
        {children}
        <Footer />
        <Toaster />
        <RoleDebugger />
      </body>
    </html>
  )
}