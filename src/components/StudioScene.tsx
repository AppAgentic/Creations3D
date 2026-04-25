"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  Html,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";

type StudioSceneProps = {
  className?: string;
  compact?: boolean;
  interactive?: boolean;
  label?: string;
};

function GeneratedObject({ compact = false }: { compact?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const scale = compact ? 0.78 : 1;

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.16;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.05;
  });

  return (
    <group ref={group} scale={scale} position={[0, compact ? -0.05 : 0.05, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[1.35, 0.82, 1.05]} />
        <meshStandardMaterial
          color="#e6eadf"
          metalness={0.28}
          roughness={0.38}
        />
      </mesh>

      <mesh castShadow position={[-0.46, 0.44, 0.08]} rotation={[0.15, 0, 0.18]}>
        <boxGeometry args={[0.62, 0.28, 1.22]} />
        <meshStandardMaterial
          color="#f7f8ef"
          metalness={0.18}
          roughness={0.42}
        />
      </mesh>

      <mesh castShadow position={[0.54, 0.42, -0.02]} rotation={[0, 0, -0.22]}>
        <cylinderGeometry args={[0.28, 0.42, 0.86, 8]} />
        <meshStandardMaterial
          color="#cfd4c9"
          metalness={0.34}
          roughness={0.34}
        />
      </mesh>

      <mesh position={[0, 0.08, 0]} scale={[1.11, 1.12, 1.11]}>
        <boxGeometry args={[1.35, 0.82, 1.05]} />
        <meshStandardMaterial
          color="#c9ff38"
          emissive="#7da900"
          emissiveIntensity={0.12}
          wireframe
          transparent
          opacity={0.36}
        />
      </mesh>

      <mesh position={[0.02, -0.49, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.012, 10, 96]} />
        <meshBasicMaterial color="#c9ff38" transparent opacity={0.7} />
      </mesh>

      <mesh position={[-0.88, -0.06, 0.52]} rotation={[0.4, 0.3, 0.2]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color="#c9ff38" emissive="#9ed900" />
      </mesh>

      <mesh position={[0.95, 0.02, -0.56]} rotation={[0.2, 0.5, 0.6]}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color="#f7f8ef" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
}

function SceneFallback() {
  return (
    <Html center>
      <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">
        Loading viewport
      </div>
    </Html>
  );
}

function CameraTarget() {
  const { camera } = useThree();

  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function StudioScene({
  className = "",
  compact = false,
  interactive = false,
  label = "Generated 3D model preview",
}: StudioSceneProps) {
  const hasPositionClass = /\b(absolute|relative|fixed|sticky)\b/.test(
    className
  );

  return (
    <div
      className={`overflow-hidden bg-[#080a08] ${
        hasPositionClass ? "" : "relative"
      } ${className}`}
      aria-label={label}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_38%,rgba(201,255,56,0.16),transparent_28%),linear-gradient(120deg,rgba(255,255,255,0.08),transparent_36%,rgba(255,255,255,0.03))]" />
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        className="relative z-10"
      >
        <PerspectiveCamera
          makeDefault
          fov={compact ? 44 : 38}
          position={compact ? [3, 2, 4] : [4.2, 2.4, 5.2]}
        />
        <CameraTarget />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 4]} intensity={2.4} castShadow />
        <pointLight position={[-4, 2, -2]} intensity={1.2} color="#c9ff38" />
        <Suspense fallback={<SceneFallback />}>
          <Float
            speed={compact ? 1.4 : 1}
            rotationIntensity={compact ? 0.16 : 0.24}
            floatIntensity={compact ? 0.14 : 0.28}
          >
            <GeneratedObject compact={compact} />
          </Float>
          <Environment preset="studio" />
        </Suspense>
        <gridHelper
          args={[compact ? 7 : 11, compact ? 14 : 22, "#344035", "#171d18"]}
          position={[0, -0.95, 0]}
        />
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
          />
        )}
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#080a08] to-transparent" />
    </div>
  );
}
