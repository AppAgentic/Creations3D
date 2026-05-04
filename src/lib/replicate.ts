import Replicate, { type Prediction } from "replicate";

// Initialize Replicate client
// In Firebase App Hosting, env vars are auto-injected via apphosting.yaml
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
});

const SHAPE_E_VERSION =
  "5957069d5c509126a73c7cb68abcddbb985aeefa4d318e7c63ec1352ce6da68c";
const SHAPE_E_INPUT_DEFAULTS = {
  guidance_scale: 15,
  render_mode: "nerf",
  render_size: 256,
  save_mesh: true,
};

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

export interface PredictionStart {
  predictionId: string;
  status: Prediction["status"];
}

export interface PredictionStatusResult {
  status: Prediction["status"];
  modelUrl?: string;
  format?: string;
  previewUrl?: string;
  error?: string;
}

function normalizeOutputUrl(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof URL) {
    return value.toString();
  }

  if (typeof value === "object" && value) {
    const text = value.toString();
    if (text.startsWith("http") || text.startsWith("data:")) {
      return text;
    }
  }

  return "";
}

function collectOutputUrls(output: unknown): string[] {
  if (!output) return [];

  if (typeof output === "string") {
    return output ? [output] : [];
  }

  if (Array.isArray(output)) {
    return output.flatMap((item) => collectOutputUrls(item));
  }

  if (typeof output === "object") {
    const record = output as Record<string, unknown>;
    const urlValue = record.url;
    const urls: string[] = [];

    if (typeof urlValue === "string") {
      urls.push(urlValue);
    }

    if (urlValue instanceof URL) {
      urls.push(urlValue.toString());
    }

    if (typeof urlValue === "function") {
      const url = (urlValue as () => URL | string).call(output);
      urls.push(url instanceof URL ? url.toString() : String(url));
    }

    const normalized = normalizeOutputUrl(output);
    if (normalized) {
      urls.push(normalized);
    }

    for (const key of ["mesh", "model", "glb", "obj", "output"]) {
      urls.push(...collectOutputUrls(record[key]));
    }

    for (const value of Object.values(record)) {
      urls.push(...collectOutputUrls(value));
    }

    return [...new Set(urls.filter(Boolean))];
  }

  return [];
}

function getUrlExtension(url: string) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.match(/\.([a-z0-9]+)$/)?.[1] || "";
  } catch {
    return (
      url
        .toLowerCase()
        .split("?")[0]
        .match(/\.([a-z0-9]+)$/)?.[1] || ""
    );
  }
}

function findModelOutputUrl(output: unknown): string {
  const urls = collectOutputUrls(output);
  const modelUrl = urls.find((url) =>
    ["glb", "gltf", "obj"].includes(getUrlExtension(url))
  );

  return modelUrl || urls[0] || "";
}

function findPreviewOutputUrl(output: unknown): string {
  const urls = collectOutputUrls(output);
  return (
    urls.find((url) =>
      ["gif", "mp4", "webm", "png", "jpg", "jpeg"].includes(
        getUrlExtension(url)
      )
    ) || ""
  );
}

function getFormatFromUrl(modelUrl: string) {
  const extension = getUrlExtension(modelUrl);
  if (extension === "obj") return "obj";
  if (extension === "gltf") return "gltf";
  return "glb";
}

// Text to 3D using Shap-E model
// Model: cjwbw/shap-e - generates 3D from text prompts
// Cost: ~$0.09 per run
export async function textTo3D(
  input: TextTo3DInput
): Promise<GenerationResult> {
  const output = await replicate.run(`cjwbw/shap-e:${SHAPE_E_VERSION}`, {
    input: {
      prompt: input.prompt,
      ...SHAPE_E_INPUT_DEFAULTS,
    },
  });

  const modelUrl = findModelOutputUrl(output);

  return {
    modelUrl,
    format: getFormatFromUrl(modelUrl),
    previewUrl: findPreviewOutputUrl(output),
  };
}

export async function createTextTo3DPrediction(
  input: TextTo3DInput
): Promise<PredictionStart> {
  const prediction = await replicate.predictions.create({
    version: SHAPE_E_VERSION,
    input: {
      prompt: input.prompt,
      ...SHAPE_E_INPUT_DEFAULTS,
    },
  });

  return {
    predictionId: prediction.id,
    status: prediction.status,
  };
}

export async function getTextTo3DPredictionResult(
  predictionId: string
): Promise<PredictionStatusResult> {
  const prediction = await replicate.predictions.get(predictionId);

  if (prediction.status === "succeeded") {
    const modelUrl = findModelOutputUrl(prediction.output);

    return {
      status: prediction.status,
      modelUrl,
      format: getFormatFromUrl(modelUrl),
      previewUrl: findPreviewOutputUrl(prediction.output),
    };
  }

  if (prediction.status === "failed" || prediction.status === "canceled") {
    return {
      status: prediction.status,
      error:
        typeof prediction.error === "string"
          ? prediction.error
          : "Prediction did not complete.",
    };
  }

  return {
    status: prediction.status,
  };
}

// Image to 3D using TRELLIS model (recommended)
// Model: firtoz/trellis - powerful 3D asset generation, 599K+ runs
// Cost: ~$0.08 per run
export async function imageTo3D(
  input: ImageTo3DInput
): Promise<GenerationResult> {
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
export async function imageTo3DHunyuan(
  input: ImageTo3DInput
): Promise<GenerationResult> {
  const output = await replicate.run("prunaai/hunyuan3d-2", {
    input: {
      image: input.imageUrl,
    },
  });

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
export async function waitForPrediction(
  predictionId: string,
  maxWaitMs = 120000
) {
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
