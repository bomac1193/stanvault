import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Imprint - Know Your Fans",
  description: "Fan intelligence platform for creators. Connect your platforms, discover your core fans, and build your legacy.",
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
