import Replicate from "replicate";

// Initialize Replicate client
// In Firebase App Hosting, env vars are auto-injected via apphosting.yaml
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
});

export interface TextTo3DInput {
  prompt: string;
}

export interface ImageTo3DInput {
  imageUrl: string;
}

export interface GenerationResult {
  modelUrl: string;
  format: string;
  previewUrl?: string;
}

// Text to 3D using Shap-E model
// Model: cjwbw/shap-e - generates 3D from text prompts
// Cost: ~$0.09 per run
export async function textTo3D(input: TextTo3DInput): Promise<GenerationResult> {
  const output = await replicate.run(
    "cjwbw/shap-e:5957069d5c509126a73c7cb68abcddbb985aeefa4d318e7c63ec1352ce6da68c",
    {
      input: {
        prompt: input.prompt,
        guidance_scale: 15,
        render_mode: "nerf",
        render_size: 256,
        save_mesh: true,
      },
    }
  );

  // Shap-E returns an object with mesh file
  const result = output as { mesh?: string } | string[];
  let modelUrl: string;

  if (Array.isArray(result)) {
    // Find the GLB/OBJ file in the output array
    modelUrl = result.find((url) => url.endsWith(".glb") || url.endsWith(".obj")) || result[0];
  } else if (typeof result === "object" && result.mesh) {
    modelUrl = result.mesh;
  } else {
    modelUrl = result as unknown as string;
  }

  return {
    modelUrl,
    format: modelUrl.endsWith(".obj") ? "obj" : "glb",
  };
}

// Image to 3D using TRELLIS model (recommended)
// Model: firtoz/trellis - powerful 3D asset generation, 599K+ runs
// Cost: ~$0.08 per run
export async function imageTo3D(input: ImageTo3DInput): Promise<GenerationResult> {
  const output = await replicate.run(
    "firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c",
    {
      input: {
        images: [input.imageUrl],
        generate_model: true,
        generate_color: true,
        texture_size: 1024,
        mesh_simplify: 0.95,
        ss_sampling_steps: 12,
        slat_sampling_steps: 12,
      },
    }
  );

  // TRELLIS returns an object with model and video URLs
  const result = output as {
    model?: string;
    color_video?: string;
  };

  return {
    modelUrl: result.model || "",
    format: "glb",
    previewUrl: result.color_video,
  };
}

// Alternative: Image to 3D using Hunyuan3D (high quality)
// Model: prunaai/hunyuan3d-2
export async function imageTo3DHunyuan(input: ImageTo3DInput): Promise<GenerationResult> {
  const output = await replicate.run(
    "prunaai/hunyuan3d-2",
    {
      input: {
        image: input.imageUrl,
      },
    }
  );

  const result = output as { glb?: string } | string;
  const modelUrl = typeof result === "object" ? result.glb || "" : result;

  return {
    modelUrl,
    format: "glb",
  };
}

// Create prediction for async operations (for long-running models)
export async function createPrediction(
  model: string,
  input: Record<string, unknown>
) {
  const prediction = await replicate.predictions.create({
    model,
    input,
  });
  return prediction;
}

// Check prediction status
export async function getPredictionStatus(predictionId: string) {
  const prediction = await replicate.predictions.get(predictionId);
  return prediction;
}

// Wait for prediction to complete
export async function waitForPrediction(predictionId: string, maxWaitMs = 120000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const prediction = await getPredictionStatus(predictionId);

    if (prediction.status === "succeeded") {
      return prediction;
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(`Prediction ${prediction.status}: ${prediction.error}`);
    }

    // Wait 2 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Prediction timed out");
}

export { replicate };
