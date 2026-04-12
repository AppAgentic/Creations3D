// World Labs Marble API Client
// Generates navigable 3D environments from text, images, or video

const WORLDLABS_API_BASE = "https://api.worldlabs.ai";

export type WorldInputType = "text" | "image" | "multi-image" | "video";
export type WorldModel = "Marble 0.1-mini" | "Marble 0.1-plus";

export interface WorldGenerationInput {
  displayName?: string;
  type: WorldInputType;
  textPrompt?: string;
  imageUrl?: string;
  imageUrls?: { url: string; azimuth: number }[]; // For multi-image
  model?: WorldModel;
}

export interface WorldAssets {
  splat100k?: string;
  splat500k?: string;
  splatFull?: string;
  glbMesh?: string;
  panorama?: string;
}

export interface WorldResult {
  worldId: string;
  viewerUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  assets: WorldAssets;
}

export interface OperationStatus {
  operationId: string;
  done: boolean;
  error?: string;
  result?: {
    worldId: string;
    viewerUrl: string;
  };
}

// Helper to make authenticated requests
async function worldLabsRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = process.env.WORLDLABS_API_KEY;

  if (!apiKey) {
    throw new Error("WORLDLABS_API_KEY is not configured");
  }

  const response = await fetch(`${WORLDLABS_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "WLT-Api-Key": apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`World Labs API error (${response.status}): ${errorText}`);
  }

  return response;
}

// Start world generation - returns operation ID for polling
export async function generateWorld(
  input: WorldGenerationInput
): Promise<string> {
  const requestBody: Record<string, unknown> = {
    display_name: input.displayName || "Generated World",
    world_prompt: {
      type: input.type,
      model: input.model || "Marble 0.1-plus",
    },
  };

  // Add type-specific fields
  if (input.type === "text" && input.textPrompt) {
    (requestBody.world_prompt as Record<string, unknown>).text_prompt =
      input.textPrompt;
  } else if (input.type === "image" && input.imageUrl) {
    (requestBody.world_prompt as Record<string, unknown>).image_url =
      input.imageUrl;
  } else if (input.type === "multi-image" && input.imageUrls) {
    (requestBody.world_prompt as Record<string, unknown>).images =
      input.imageUrls;
  }

  const response = await worldLabsRequest("/marble/v1/worlds:generate", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  // Extract operation ID from response
  // Format: operations/{operation_id}
  const operationName = data.name || data.operation;
  const operationId = operationName?.split("/").pop();

  if (!operationId) {
    throw new Error("No operation ID returned from World Labs API");
  }

  return operationId;
}

// Poll operation status
export async function getOperationStatus(
  operationId: string
): Promise<OperationStatus> {
  const response = await worldLabsRequest(
    `/marble/v1/operations/${operationId}`
  );
  const data = await response.json();

  return {
    operationId,
    done: data.done || false,
    error: data.error?.message,
    result: data.response
      ? {
          worldId: data.response.world_id,
          viewerUrl: `https://marble.worldlabs.ai/world/${data.response.world_id}`,
        }
      : undefined,
  };
}

// Get full world data including assets
export async function getWorldData(worldId: string): Promise<WorldResult> {
  const response = await worldLabsRequest(`/marble/v1/worlds/${worldId}`);
  const data = await response.json();

  // Extract asset URLs from response
  const assets: WorldAssets = {};

  if (data.assets) {
    // SPZ splat files at different resolutions
    if (data.assets.splat_100k) assets.splat100k = data.assets.splat_100k;
    if (data.assets.splat_500k) assets.splat500k = data.assets.splat_500k;
    if (data.assets.splat_full || data.assets.splat)
      assets.splatFull = data.assets.splat_full || data.assets.splat;

    // GLB mesh
    if (data.assets.glb_mesh || data.assets.mesh || data.assets.collider_mesh)
      assets.glbMesh =
        data.assets.glb_mesh || data.assets.mesh || data.assets.collider_mesh;

    // Panorama image
    if (data.assets.panorama || data.assets.panoramic_image)
      assets.panorama = data.assets.panorama || data.assets.panoramic_image;
  }

  return {
    worldId,
    viewerUrl: `https://marble.worldlabs.ai/world/${worldId}`,
    thumbnailUrl: data.thumbnail_url || data.thumbnail,
    caption: data.caption || data.ai_caption,
    assets,
  };
}

// Poll until operation completes (with timeout)
export async function waitForWorldGeneration(
  operationId: string,
  maxWaitMs: number = 600000, // 10 minutes default (Plus takes ~5 min)
  pollIntervalMs: number = 5000 // Poll every 5 seconds
): Promise<WorldResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getOperationStatus(operationId);

    if (status.error) {
      throw new Error(`World generation failed: ${status.error}`);
    }

    if (status.done && status.result) {
      // Get full world data with assets
      return await getWorldData(status.result.worldId);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("World generation timed out");
}

// Upload media file and get URL for generation
export async function prepareMediaUpload(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; mediaUrl: string }> {
  const response = await worldLabsRequest(
    "/marble/v1/media-assets:prepare_upload",
    {
      method: "POST",
      body: JSON.stringify({
        filename,
        content_type: contentType,
      }),
    }
  );

  const data = await response.json();

  return {
    uploadUrl: data.upload_url,
    mediaUrl: data.media_url || data.asset_url,
  };
}

// Upload file to signed URL
export async function uploadMedia(
  uploadUrl: string,
  file: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload media: ${response.status}`);
  }
}

// Helper: Get credit cost for model
export function getModelCreditCost(model: WorldModel): number {
  return model === "Marble 0.1-mini" ? 3 : 5;
}
