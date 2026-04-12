"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
import { Loader2 } from "lucide-react";

interface ModelProps {
  url: string;
  onLoad?: () => void;
}

function Model({ url, onLoad }: ModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene) {
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;

      scene.position.sub(center);
      scene.scale.setScalar(scale);

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

function Scene({ modelUrl }: { modelUrl: string | null }) {
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
      <Environment preset="night" background={false} />

      {/* Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.2} />
      </mesh>

      {/* Grid helper */}
      <gridHelper args={[10, 10, "#333344", "#222233"]} position={[0, -1, 0]} />

      {/* Model */}
      {modelUrl && (
        <Suspense fallback={<Loader />}>
          <Center>
            <Model url={modelUrl} />
          </Center>
        </Suspense>
      )}
    </>
  );
}

interface ModelViewerProps {
  modelUrl: string | null;
  className?: string;
}

export function ModelViewer({ modelUrl, className = "" }: ModelViewerProps) {
  return (
    <div className={`relative w-full h-full min-h-[300px] ${className}`}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        className="rounded-lg"
      >
        <color attach="background" args={["#0e0e14"]} />
        <Scene modelUrl={modelUrl} />
      </Canvas>

      {/* Overlay when no model */}
      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none" style={{ background: "oklch(0.09 0.005 270 / 0.7)" }}>
          <p className="text-muted-foreground">Your 3D model will appear here</p>
        </div>
      )}

      {/* Controls hint */}
      {modelUrl && (
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground glass glass-border px-2 py-1 rounded">
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
