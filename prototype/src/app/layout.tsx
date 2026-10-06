import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Inspector (prototype)",
  description:
    "Acorn virtual assessment workflow prototype — role-play data only",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Client surfaces are used one-handed outdoors; never block pinch-zoom.
  maximumScale: 5,
  themeColor: "#14181c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* One interface font. JetBrains Mono is used only for reference codes.
            Both degrade to the system stack in globals.css if unavailable. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-page text-foreground">{children}</body>
    </html>
  );
}
