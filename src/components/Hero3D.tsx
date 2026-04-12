"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Icosahedron, Torus, Octahedron, Box } from "@react-three/drei";
import * as THREE from "three";

function FloatingGeo() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main — distorted icosahedron */}
      <Float speed={1.8} rotationIntensity={0.3} floatIntensity={1.2}>
        <Icosahedron args={[1.3, 4]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#00d4ff"
            roughness={0.12}
            metalness={0.92}
            distort={0.22}
            speed={1.8}
          />
        </Icosahedron>
      </Float>

      {/* Orbiting torus */}
      <Float speed={2.5} rotationIntensity={0.8} floatIntensity={0.6}>
        <Torus args={[0.55, 0.1, 16, 32]} position={[2.4, 0.7, -0.3]} rotation={[Math.PI / 3, 0, 0]}>
          <MeshWobbleMaterial color="#c026d3" roughness={0.18} metalness={0.85} factor={0.25} speed={1.2} />
        </Torus>
      </Float>

      {/* Octahedron */}
      <Float speed={3.5} rotationIntensity={1.8} floatIntensity={0.9}>
        <Octahedron args={[0.4]} position={[-2.1, -0.6, 0.4]}>
          <meshStandardMaterial color="#7c3aed" roughness={0.08} metalness={0.95} />
        </Octahedron>
      </Float>

      {/* Small cube */}
      <Float speed={4} rotationIntensity={2.5} floatIntensity={1.5}>
        <Box args={[0.22, 0.22, 0.22]} position={[1.6, -1.3, 0.8]}>
          <meshStandardMaterial color="#06b6d4" roughness={0.12} metalness={0.92} />
        </Box>
      </Float>

      {/* Small accent */}
      <Float speed={2.2} rotationIntensity={1.2} floatIntensity={1}>
        <Icosahedron args={[0.28, 1]} position={[-1.9, 1.3, -0.6]}>
          <meshStandardMaterial color="#ec4899" roughness={0.15} metalness={0.88} />
        </Icosahedron>
      </Float>

      {/* Wireframe ring 1 */}
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <Torus args={[2.2, 0.012, 8, 80]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#00d4ff" opacity={0.18} transparent />
        </Torus>
      </Float>

      {/* Wireframe ring 2 */}
      <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.4}>
        <Torus args={[2.8, 0.008, 8, 80]} position={[0, 0, 0]} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <meshBasicMaterial color="#c026d3" opacity={0.1} transparent />
        </Torus>
      </Float>
    </group>
  );
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.008;
    }
  });

  const count = 180;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#00d4ff" size={0.018} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

export function Hero3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} color="#00d4ff" />
        <directionalLight position={[-5, -3, 5]} intensity={0.35} color="#c026d3" />
        <pointLight position={[0, 3, 2]} intensity={0.4} color="#7c3aed" />
        <FloatingGeo />
        <Particles />
      </Canvas>
    </div>
  );
}
