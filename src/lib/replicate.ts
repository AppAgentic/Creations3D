import Replicate, { type Prediction } from "replicate";

// Initialize Replicate client
// In Firebase App Hosting, env vars are auto-injected via apphosting.yaml
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
});

export const TEXT_TO_3D_PROVIDER_MODEL = "hyper3d/rodin";
const RODIN_INPUT_DEFAULTS = {
  tier: "Gen-2",
  quality: "medium",
  material: "PBR",
  mesh_mode: "Quad",
  geometry_file_format: "glb",
  preview_render: true,
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

async function resolveOutputUrl(value: unknown): Promise<string> {
  if (typeof value === "object" && value) {
    const record = value as Record<string, unknown>;
    if (typeof record.url === "function") {
      const url = await (
        record.url as () => Promise<URL | string> | URL | string
      ).call(value);
      return url instanceof URL ? url.toString() : String(url);
    }
  }

  return normalizeOutputUrl(value);
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

async function collectOutputUrlsAsync(
  output: unknown,
  seen = new Set<unknown>()
): Promise<string[]> {
  if (!output || seen.has(output)) return [];

  if (typeof output === "string") {
    return output ? [output] : [];
  }

  if (output instanceof URL) {
    return [output.toString()];
  }

  if (Array.isArray(output)) {
    const nested = await Promise.all(
      output.map((item) => collectOutputUrlsAsync(item, seen))
    );
    return [...new Set(nested.flat().filter(Boolean))];
  }

  if (typeof output === "object") {
    seen.add(output);

    const urls: string[] = [];
    const normalized = await resolveOutputUrl(output);
    if (normalized) urls.push(normalized);

    const record = output as Record<string, unknown>;
    for (const key of ["mesh", "model", "model_file", "glb", "obj", "output"]) {
      urls.push(...(await collectOutputUrlsAsync(record[key], seen)));
    }

    const nested = await Promise.all(
      Object.values(record).map((value) => collectOutputUrlsAsync(value, seen))
    );
    urls.push(...nested.flat());

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

async function findModelOutputUrlAsync(output: unknown): Promise<string> {
  const urls = await collectOutputUrlsAsync(output);
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

async function findPreviewOutputUrlAsync(output: unknown): Promise<string> {
  const urls = await collectOutputUrlsAsync(output);
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

// Text to 3D using Hyper3D Rodin Gen-2.
// This is kept for synchronous callers; the app generation flow uses async
// predictions so users can wait on longer high-quality runs.
export async function textTo3D(
  input: TextTo3DInput
): Promise<GenerationResult> {
  const output = await replicate.run(TEXT_TO_3D_PROVIDER_MODEL, {
    input: {
      prompt: input.prompt,
      ...RODIN_INPUT_DEFAULTS,
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
    model: TEXT_TO_3D_PROVIDER_MODEL,
    input: {
      prompt: input.prompt,
      ...RODIN_INPUT_DEFAULTS,
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

export const IMAGE_TO_3D_PROVIDER_MODEL = "tencent/hunyuan-3d-3.1";
const IMAGE_TO_3D_PROVIDER_VERSION =
  "a2838628b41a2e0ee2eb19b3ea98a40d75f8d7639bf5a1ddd37ea299bb334854";
const IMAGE_TO_3D_INPUT_DEFAULTS = {
  enable_pbr: false,
  face_count: 50000,
  generate_type: "Normal",
};

export async function imageTo3D(
  input: ImageTo3DInput
): Promise<GenerationResult> {
  const output = await replicate.run(
    `${IMAGE_TO_3D_PROVIDER_MODEL}:${IMAGE_TO_3D_PROVIDER_VERSION}`,
    {
      input: {
        image: input.imageUrl,
        ...IMAGE_TO_3D_INPUT_DEFAULTS,
      },
    }
  );

  const modelUrl = await findModelOutputUrlAsync(output);

  return {
    modelUrl,
    format: getFormatFromUrl(modelUrl),
    previewUrl: await findPreviewOutputUrlAsync(output),
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
