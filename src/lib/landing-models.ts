export type LandingModelAsset = {
  id: string;
  title: string;
  label: string;
  prompt: string;
  useCase: string;
  modelUrl: string;
  previewUrl: string;
  scale?: number;
  rotation?: [number, number, number];
  credit: string;
  license: string;
  sourceUrl: string;
};

const CDN_ROOT =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models";
const RAW_ROOT =
  "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models";

export const landingModelAssets: LandingModelAsset[] = [
  {
    id: "toy-car",
    title: "Toy car",
    label: "product mockup",
    prompt: "Small translucent concept car with soft studio reflections",
    useCase: "Commerce preview / prototype pitch",
    modelUrl: `${CDN_ROOT}/ToyCar/glTF-Binary/ToyCar.glb`,
    previewUrl: `${CDN_ROOT}/ToyCar/screenshot/screenshot.jpg`,
    scale: 1.05,
    rotation: [0.03, -0.75, 0],
    credit: "Guido Odendahl + Eric Chadwick / Khronos glTF Sample Assets",
    license: "CC0 1.0",
    sourceUrl: `${RAW_ROOT}/ToyCar`,
  },
  {
    id: "boom-box",
    title: "Boom box",
    label: "hard-surface asset",
    prompt: "Portable speaker with glowing panel and layered materials",
    useCase: "Hard-surface asset / electronics mockup",
    modelUrl: `${CDN_ROOT}/BoomBox/glTF-Binary/BoomBox.glb`,
    previewUrl: `${CDN_ROOT}/BoomBox/screenshot/screenshot.jpg`,
    scale: 0.94,
    rotation: [0.05, -0.45, 0],
    credit: "Microsoft / Khronos glTF Sample Assets",
    license: "CC0 1.0",
    sourceUrl: `${RAW_ROOT}/BoomBox`,
  },
  {
    id: "lantern",
    title: "Lantern",
    label: "environment prop",
    prompt: "Weathered street lantern for a compact inspection bay",
    useCase: "Scene prop / environment mockup",
    modelUrl: `${CDN_ROOT}/Lantern/glTF-Binary/Lantern.glb`,
    previewUrl: `${CDN_ROOT}/Lantern/screenshot/screenshot.jpg`,
    scale: 1.1,
    rotation: [0.03, 0.58, 0],
    credit: "sbtron + Frank Galligan / Khronos glTF Sample Assets",
    license: "CC0 1.0",
    sourceUrl: `${RAW_ROOT}/Lantern`,
  },
  {
    id: "water-bottle",
    title: "Water bottle",
    label: "packaging model",
    prompt:
      "Matte metal water bottle with roughness detail and soft studio light",
    useCase: "Product render / ecommerce asset",
    modelUrl: `${CDN_ROOT}/WaterBottle/glTF-Binary/WaterBottle.glb`,
    previewUrl: `${CDN_ROOT}/WaterBottle/screenshot/screenshot.jpg`,
    scale: 1.16,
    rotation: [0.02, -0.25, 0],
    credit: "Microsoft / Khronos glTF Sample Assets",
    license: "CC0 1.0",
    sourceUrl: `${RAW_ROOT}/WaterBottle`,
  },
];
