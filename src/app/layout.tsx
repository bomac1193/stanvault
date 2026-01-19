import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Stanvault - Know Your Fans",
  description: "Fan intelligence platform for artists. Connect your platforms, discover your superfans, and build your legacy.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
