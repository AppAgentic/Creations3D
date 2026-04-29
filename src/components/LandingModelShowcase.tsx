"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Center,
  Environment,
  Float,
  Html,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { Box, Loader2, Sparkles } from "lucide-react";
import {
  landingModelAssets,
  type LandingModelAsset,
} from "@/lib/landing-models";

type LandingModelShowcaseProps = {
  className?: string;
};

function ModelLoader() {
  return (
    <Html center>
      <div className="flex items-center gap-2 border border-white/10 bg-black/60 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/58 backdrop-blur">
        <Loader2 className="size-3.5 animate-spin text-primary" />
        Loading asset
      </div>
    </Html>
  );
}

function ShowcaseModel({ asset }: { asset: LandingModelAsset }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(asset.modelUrl);

  const normalizedScene = useMemo(() => {
    const clone = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const fitScale = (asset.scale ?? 1) * (2.85 / maxDimension);

    clone.position.sub(center);
    clone.scale.setScalar(fitScale);

    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    return clone;
  }, [asset.scale, scene]);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y =
      (asset.rotation?.[1] ?? 0) + state.clock.elapsedTime * 0.12;
    group.current.rotation.x =
      (asset.rotation?.[0] ?? 0) +
      Math.sin(state.clock.elapsedTime * 0.5) * 0.025;
  });

  return (
    <Float speed={1.05} rotationIntensity={0.08} floatIntensity={0.22}>
      <group ref={group} rotation={asset.rotation ?? [0, 0, 0]}>
        <primitive object={normalizedScene} />
      </group>
    </Float>
  );
}

function ShowcaseScene({ asset }: { asset: LandingModelAsset }) {
  return (
    <>
      <PerspectiveCamera makeDefault fov={36} position={[3.5, 2.2, 5.8]} />
      <ambientLight intensity={0.82} />
      <directionalLight position={[4, 5.5, 5]} intensity={2.8} castShadow />
      <pointLight position={[-3.8, 1.2, 2.2]} intensity={1.1} color="#c9ff38" />
      <pointLight
        position={[2.8, -1.5, -2.2]}
        intensity={0.55}
        color="#ffffff"
      />
      <Suspense fallback={<ModelLoader />}>
        <Center>
          <ShowcaseModel asset={asset} />
        </Center>
        <Environment preset="studio" />
      </Suspense>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.52, 0]}
        receiveShadow
      >
        <circleGeometry args={[2.45, 96]} />
        <meshBasicMaterial color="#c9ff38" transparent opacity={0.055} />
      </mesh>
      <gridHelper
        args={[8, 20, "#c9ff38", "#1c271c"]}
        position={[0, -1.5, 0]}
      />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={false}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.75}
      />
    </>
  );
}

export function LandingModelShowcase({
  className = "",
}: LandingModelShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeAsset = landingModelAssets[activeIndex];
  const hasPositionClass = /\b(absolute|relative|fixed|sticky)\b/.test(
    className
  );

  useEffect(() => {
    landingModelAssets.forEach((asset) => {
      useGLTF.preload(asset.modelUrl);
    });
  }, []);

  return (
    <div
      className={`${hasPositionClass ? "" : "relative"} isolate overflow-hidden bg-[#080a08] ${className}`}
      aria-label="Interactive 3D asset examples"
    >
      <div className="pointer-events-none absolute inset-0 studio-grid opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_34%,rgba(201,255,56,0.2),transparent_28%),linear-gradient(132deg,rgba(255,255,255,0.11),transparent_38%,rgba(255,255,255,0.04))]" />
      <div className="pointer-events-none absolute -right-24 top-10 size-[32rem] rounded-full border border-primary/15" />
      <div className="pointer-events-none absolute right-12 top-24 size-[18rem] rounded-full border border-white/10" />

      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="relative z-10"
      >
        <ShowcaseScene asset={activeAsset} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/3 bg-gradient-to-t from-[#080a08] to-transparent" />

      <div className="absolute left-4 top-4 z-30 flex items-center gap-2 border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 backdrop-blur md:left-6 md:top-6">
        <Sparkles className="size-3.5 text-primary" />
        Live 3D previews
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-30 md:bottom-6 md:left-6 md:right-6 lg:bottom-auto lg:left-auto lg:right-6 lg:top-24 lg:w-[28rem]">
        <div className="max-w-xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                {activeAsset.label}
              </p>
              <h2 className="mt-2 font-display text-3xl font-black leading-none text-white md:text-5xl">
                {activeAsset.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 border border-primary/35 bg-primary/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              <Box className="size-3" />
              GLB ready
            </div>
          </div>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/62 md:text-base">
            “{activeAsset.prompt}”
          </p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-px border border-white/10 bg-white/10">
          {landingModelAssets.map((asset, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`group relative min-h-24 overflow-hidden bg-[#0d110d] text-left transition-opacity hover:opacity-95 ${
                  isActive ? "ring-1 ring-inset ring-primary" : ""
                }`}
                aria-label={`Preview ${asset.title}`}
              >
                <Image
                  src={asset.previewUrl}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 9vw, 25vw"
                  className="object-cover opacity-50 grayscale transition duration-300 group-hover:scale-105 group-hover:opacity-70 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/78">
                  {asset.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
