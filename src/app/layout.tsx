import type { Metadata } from "next";
import { Syne, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import "./globals.css";

const syne = Syne({
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
  title: "Creations3D — Where Imagination Takes Shape",
  description:
    "Transform text and images into production-ready 3D models in seconds. Built for game developers, architects, and designers.",
  keywords: ["3D", "AI", "model generation", "text to 3D", "image to 3D"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {/* Aurora background blobs */}
        <div className="aurora-bg">
          <div className="aurora-blob" />
          <div className="aurora-blob" />
          <div className="aurora-blob" />
          <div className="aurora-blob" />
        </div>

        <div className="relative z-[1]">
          <Providers>{children}</Providers>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0a0a0f",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#e0e0e6",
            },
          }}
        />
      </body>
    </html>
  );
}
