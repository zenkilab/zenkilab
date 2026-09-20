import type { Metadata } from "next";
import Script from "next/script";
import { Inter, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-wordmark",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const GA_ID = "G-S2785W90R5";

export const metadata: Metadata = {
  title: "Zenki Lab · Custom 3D Printing Workshop",
  description:
    "Professional custom 3D printing services based in Sri Lanka. We manufacture parts, prototypes and one-off projects from your 3D models. Built by makers, for makers.",
  keywords: [
    "3D printing",
    "custom parts",
    "custom manufacturing",
    "prototypes",
    "automotive parts",
    "Zenki Lab",
    "Sri Lanka",
    "3D printing service",
  ],
  authors: [{ name: "Zenki Lab" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Zenki Lab · Custom 3D Printing Workshop",
    description:
      "Professional custom 3D printing for makers, enthusiasts and businesses. We manufacture custom parts, prototypes and one-off projects from your 3D models.",
    url: "https://zenkilab.com",
    siteName: "Zenki Lab",
    locale: "en_US",
    type: "website",
    images: ["/favicon.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://zenkilab.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="min-h-screen bg-background text-white font-sans">
        {children}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');`}
        </Script>
      </body>
    </html>
  );
}