import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import MobileNav from "./_components/navigation/mobile-nav";
import Header from "./_components/navigation/header";
import Footer from "./_components/navigation/footer";

const archivo = localFont({
  src: [
    {
      path: "./_assets/fonts/Archivo-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./_assets/fonts/Archivo-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./_assets/fonts/Archivo-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-archivo",
  display: "swap",
});

const besleyCondensed = localFont({
  src: [
    {
      path: "./_assets/fonts/BesleyCondensed-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./_assets/fonts/BesleyCondensed-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
  ],
  variable: "--font-besley-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unearth News - Home to transparent reporting",
  description: "A civic intelligence tool",
  metadataBase: new URL("https://unearth.news"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://unearth.news/",
    siteName: "Unearth News",
    title: "Unearth News",
    description: "A civic intelligence tool",
    images: [
      {
        url: "./_assets/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Unearth News",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unearth News",
    description: "A civic intelligence tool",
    images: ["./_assets/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${besleyCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="min-h-screen">{children}</main>
        <MobileNav />
        <Footer />
      </body>
    </html>
  );
}
