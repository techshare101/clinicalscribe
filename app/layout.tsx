import type React from "react"
import type { Metadata } from "next"
import { Navigation } from "@/components/Navigation"
import "./globals.css"

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
    <html lang="en">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  )
}