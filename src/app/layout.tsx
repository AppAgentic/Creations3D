import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creations3D — AI 3D Model Generator from Text & Images",
  description:
    "Generate production-ready 3D models from text prompts or images. Export GLB, FBX, OBJ for Unity, Unreal, and Blender. PBR textures included. 30-second generation.",
  keywords: [
    "AI 3D model generator",
    "text to 3D",
    "image to 3D",
    "3D world generation",
    "PBR textures",
    "Unity assets",
    "Unreal Engine assets",
    "Blender 3D models",
    "GLB export",
    "FBX export",
    "game development assets",
  ],
  openGraph: {
    title: "Creations3D — AI 3D Model Generator",
    description:
      "Text to 3D, image to 3D, and 3D world generation. Ready for Unity, Unreal, Blender.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
