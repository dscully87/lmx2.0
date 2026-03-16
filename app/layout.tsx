import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-stadium",
  weight: "400",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "LMX — Outwit. Outlast. Outpick.",
  description:
    "The last-man-standing football prediction league. Pick a team, survive the gameweek, be the last one standing.",
  metadataBase: new URL("https://lmxgame.com"),
  openGraph: {
    title: "LMX — Outwit. Outlast. Outpick.",
    description: "The last-man-standing football prediction league.",
    siteName: "LMX",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${bebasNeue.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} font-body antialiased`}
        style={{ background: "var(--lmx-surface)", color: "var(--lmx-text)" }}
      >
        {children}
      </body>
    </html>
  );
}
