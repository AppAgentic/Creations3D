import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creations3D - AI-Powered 3D Model Generation",
  description:
    "Generate stunning 3D models from text or images using AI. Create production-ready 3D assets in seconds.",
  keywords: ["3D", "AI", "model generation", "text to 3D", "image to 3D"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased noise`}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "oklch(0.12 0.015 260)",
              border: "1px solid oklch(0.22 0.02 260 / 0.5)",
              color: "oklch(0.9 0.01 260)",
            },
          }}
        />
      </body>
    </html>
  );
}
