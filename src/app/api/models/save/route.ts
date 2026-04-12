import { NextRequest, NextResponse } from "next/server";
import { generateFileKey, uploadFile } from "@/lib/r2";
import { authenticateRequest, isAuthError } from "@/lib/auth";

// Allowed URL patterns for model downloads (SSRF protection)
const ALLOWED_HOSTS = [
  "replicate.delivery",
  "pbxt.replicate.delivery",
  "marble.worldlabs.ai",
  "api.worldlabs.ai",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS
    if (parsed.protocol !== "https:") return false;
    // Only allow known model hosts
    return ALLOWED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication — derive userId server-side
    const authResult = await authenticateRequest(request);
    if (isAuthError(authResult)) return authResult;
    const { uid: userId } = authResult;

    const body = await request.json();
    const { modelUrl, format = "glb" } = body;

    if (!modelUrl) {
      return NextResponse.json(
        { error: "Model URL is required" },
        { status: 400 }
      );
    }

    // P0 fix: SSRF protection — only allow fetching from known model hosts
    if (!isAllowedUrl(modelUrl)) {
      return NextResponse.json(
        { error: "Invalid model URL. Only models from supported providers are allowed." },
        { status: 400 }
      );
    }

    // Validate format
    if (!["glb", "obj"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Supported: glb, obj" },
        { status: 400 }
      );
    }

    // Generate a unique key for the model
    const generationId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Download the model from the trusted URL and upload to R2
    const response = await fetch(modelUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch model from URL" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = format === "obj" ? "model/obj" : "model/gltf-binary";
    const key = generateFileKey(userId, "model", format);

    const result = await uploadFile(key, buffer, contentType);

    return NextResponse.json({
      success: true,
      savedUrl: result.url,
      key: result.key,
      generationId,
    });
  } catch (error) {
    console.error("Save model error:", error);
    return NextResponse.json(
      { error: "Failed to save model" },
      { status: 500 }
    );
  }
}
