"use client";

import {
  Suspense,
  createElement,
  useRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Center,
  useGLTF,
  PerspectiveCamera,
  Html,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Loader2 } from "lucide-react";

type ModelFormat = "glb" | "gltf" | "obj";

interface ModelProps {
  url: string;
  format?: ModelFormat | string | null;
  onLoad?: () => void;
}

type ModelViewerElementProps = {
  src: string;
  "camera-controls": boolean;
  "auto-rotate": boolean;
  "shadow-intensity": string;
  exposure: string;
  "environment-image": string;
  "interaction-prompt": string;
  style: CSSProperties;
  className: string;
};

function getModelFormat(
  url: string,
  explicitFormat?: string | null
): ModelFormat {
  const explicit = explicitFormat?.toLowerCase();
  if (explicit === "obj") return "obj";
  if (explicit === "gltf") return "gltf";

  try {
    const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
    if (extension === "obj") return "obj";
    if (extension === "gltf") return "gltf";
  } catch {
    const extension = url.split("?")[0].split(".").pop()?.toLowerCase();
    if (extension === "obj") return "obj";
    if (extension === "gltf") return "gltf";
  }

  return "glb";
}

function prepareMaterial(material: THREE.Material) {
  const sourceMaterial = material as THREE.Material & {
    color?: THREE.Color;
    map?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    roughnessMap?: THREE.Texture | null;
    metalnessMap?: THREE.Texture | null;
    roughness?: number;
    metalness?: number;
  };
  const color = sourceMaterial.color?.clone() || new THREE.Color("#d8ddd6");
  const isVeryLight = color.r > 0.9 && color.g > 0.9 && color.b > 0.9;

  if (isVeryLight) {
    color.set("#d8ddd6");
  }

  return new THREE.MeshStandardMaterial({
    color,
    map: sourceMaterial.map || null,
    normalMap: sourceMaterial.normalMap || null,
    roughnessMap: sourceMaterial.roughnessMap || null,
    metalnessMap: sourceMaterial.metalnessMap || null,
    roughness:
      typeof sourceMaterial.roughness === "number"
        ? Math.max(sourceMaterial.roughness, 0.5)
        : 0.58,
    metalness:
      typeof sourceMaterial.metalness === "number"
        ? Math.min(sourceMaterial.metalness, 0.35)
        : 0.08,
    side: THREE.DoubleSide,
  });
}

function PreparedModel({
  source,
  onLoad,
}: {
  source: THREE.Object3D;
  onLoad?: () => void;
}) {
  const scene = useMemo(() => source.clone(true), [source]);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      if (maxDim > 0) {
        const scale = 2 / maxDim;
        scene.position.sub(center);
        scene.scale.setScalar(scale);
      }

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: "#c9ff38",
              roughness: 0.55,
              metalness: 0.08,
            });
            return;
          }

          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          const preparedMaterials = materials.map(prepareMaterial);

          child.material = Array.isArray(child.material)
            ? preparedMaterials
            : preparedMaterials[0];
        }
      });

      onLoad?.();
    }
  }, [scene, onLoad]);

  // Gentle rotation animation
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={scene} />
    </group>
  );
}

function Model({ url, format, onLoad }: ModelProps) {
  const resolvedFormat = getModelFormat(url, format);

  if (resolvedFormat === "obj") {
    return <ObjModel url={url} onLoad={onLoad} />;
  }

  return <GltfModel url={url} onLoad={onLoad} />;
}

function GltfModel({ url, onLoad }: ModelProps) {
  const { scene } = useGLTF(url);
  return <PreparedModel source={scene} onLoad={onLoad} />;
}

function ObjModel({ url, onLoad }: ModelProps) {
  const object = useLoader(OBJLoader, url);
  return <PreparedModel source={object} onLoad={onLoad} />;
}

function Loader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading model... {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
}

function WebModelViewer({ modelUrl }: { modelUrl: string }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("@google/model-viewer")
      .then(() => {
        if (!cancelled) setIsReady(true);
      })
      .catch((error) => {
        console.error("Failed to load model-viewer:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center bg-[#080a08]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return createElement("model-viewer", {
    src: modelUrl,
    "camera-controls": true,
    "auto-rotate": true,
    "shadow-intensity": "1",
    exposure: "0.85",
    "environment-image": "neutral",
    "interaction-prompt": "none",
    style: {
      width: "100%",
      height: "100%",
      minHeight: "300px",
      background: "#080a08",
    },
    className: "block",
  } satisfies ModelViewerElementProps);
}

function Scene({
  modelUrl,
  format,
}: {
  modelUrl: string | null;
  format?: ModelFormat | string | null;
}) {
  const { camera } = useThree();

  useEffect(() => {
    // Reset camera position when model changes
    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0, 0);
  }, [modelUrl, camera]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 2, 3]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={10}
        autoRotate={false}
        target={[0, 0, 0]}
      />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Environment for reflections */}
      <Environment preset="studio" background={false} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.2} />
      </mesh>

      {/* Grid helper */}
      <gridHelper args={[10, 10, "#888888", "#cccccc"]} position={[0, -1, 0]} />

      {/* Model */}
      {modelUrl && (
        <Suspense fallback={<Loader />}>
          <Center>
            <Model url={modelUrl} format={format} />
          </Center>
        </Suspense>
      )}
    </>
  );
}

interface ModelViewerProps {
  modelUrl: string | null;
  format?: ModelFormat | string | null;
  className?: string;
}

export function ModelViewer({
  modelUrl,
  format,
  className = "",
}: ModelViewerProps) {
  const resolvedFormat = modelUrl ? getModelFormat(modelUrl, format) : null;

  if (modelUrl && resolvedFormat !== "obj") {
    return (
      <div className={`relative h-full min-h-[300px] w-full ${className}`}>
        <WebModelViewer modelUrl={modelUrl} />
        <div className="absolute bottom-3 left-3 border border-white/10 bg-black/45 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55 backdrop-blur">
          Drag to rotate • Scroll to zoom
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[300px] ${className}`}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        className="rounded-none bg-[#080a08]"
        onCreated={({ gl }) => gl.setClearColor("#080a08", 1)}
      >
        <color attach="background" args={["#080a08"]} />
        <Scene modelUrl={modelUrl} format={format} />
      </Canvas>

      {/* Overlay when no model */}
      {!modelUrl && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#080a08]/70">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/40">
            Your 3D model will appear here
          </p>
        </div>
      )}

      {/* Controls hint */}
      {modelUrl && (
        <div className="absolute bottom-3 left-3 border border-white/10 bg-black/45 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55 backdrop-blur">
          Drag to rotate • Scroll to zoom • Shift+drag to pan
        </div>
      )}
    </div>
  );
}

// Preload function for better performance
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
