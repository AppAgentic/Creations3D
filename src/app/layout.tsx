import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Creations3D - Paid 3D asset generation studio",
  description:
    "Generate 3D models and worlds from prompts or reference images, track credits, and save useful results to an asset library.",
  keywords: ["3D", "AI", "model generation", "text to 3D", "image to 3D"],
  openGraph: {
    title: "Creations3D",
    description:
      "A paid 3D asset studio for prompt, image, and world generation.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creations3D",
    description:
      "Generate 3D models, track credits, and save useful results to your asset library.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
