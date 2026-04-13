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
  title: "Creations3D — AI 3D Model Generator | Text to 3D & Image to 3D",
  description:
    "Generate production-ready 3D models from text prompts and images in under 30 seconds. Export GLB & OBJ files for Unity, Unreal, Blender. AI-powered text-to-3D and image-to-3D for game developers, architects, and designers.",
  keywords: [
    "AI 3D model generator",
    "text to 3D",
    "image to 3D",
    "3D model from text",
    "3D model from image",
    "AI 3D generation",
    "GLB generator",
    "OBJ generator",
    "3D asset generator",
    "AI 3D tool",
    "generate 3D models",
    "3D model maker",
  ],
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
