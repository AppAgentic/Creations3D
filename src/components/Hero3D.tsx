"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Icosahedron, Torus, Octahedron, Box } from "@react-three/drei";
import * as THREE from "three";

function FloatingGeo() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main centerpiece — distorted sphere */}
      <Float speed={2} rotationIntensity={0.4} floatIntensity={1.5}>
        <Icosahedron args={[1.2, 4]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#6366f1"
            roughness={0.15}
            metalness={0.9}
            distort={0.25}
            speed={2}
          />
        </Icosahedron>
      </Float>

      {/* Orbiting torus */}
      <Float speed={3} rotationIntensity={1} floatIntensity={0.5}>
        <Torus args={[0.5, 0.12, 16, 32]} position={[2.2, 0.8, -0.5]} rotation={[Math.PI / 3, 0, 0]}>
          <MeshWobbleMaterial
            color="#a855f7"
            roughness={0.2}
            metalness={0.8}
            factor={0.3}
            speed={1.5}
          />
        </Torus>
      </Float>

      {/* Small octahedron */}
      <Float speed={4} rotationIntensity={2} floatIntensity={1}>
        <Octahedron args={[0.4]} position={[-2, -0.5, 0.5]}>
          <meshStandardMaterial
            color="#06b6d4"
            roughness={0.1}
            metalness={0.95}
          />
        </Octahedron>
      </Float>

      {/* Tiny floating cube */}
      <Float speed={5} rotationIntensity={3} floatIntensity={2}>
        <Box args={[0.25, 0.25, 0.25]} position={[1.5, -1.2, 1]}>
          <meshStandardMaterial
            color="#f43f5e"
            roughness={0.15}
            metalness={0.9}
          />
        </Box>
      </Float>

      {/* Another small shape */}
      <Float speed={2.5} rotationIntensity={1.5} floatIntensity={1.2}>
        <Icosahedron args={[0.3, 1]} position={[-1.8, 1.2, -0.8]}>
          <meshStandardMaterial
            color="#10b981"
            roughness={0.2}
            metalness={0.85}
          />
        </Icosahedron>
      </Float>

      {/* Wireframe ring */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.8}>
        <Torus args={[2, 0.015, 8, 64]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#6366f1" opacity={0.25} transparent />
        </Torus>
      </Float>

      {/* Second wireframe ring */}
      <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.5}>
        <Torus args={[2.5, 0.01, 8, 64]} position={[0, 0, 0]} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <meshBasicMaterial color="#a855f7" opacity={0.15} transparent />
        </Torus>
      </Float>
    </group>
  );
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#6366f1"
        size={0.02}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

export function Hero3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#6366f1" />
        <directionalLight position={[-5, -5, 5]} intensity={0.4} color="#a855f7" />
        <pointLight position={[0, 3, 3]} intensity={0.5} color="#06b6d4" />

        <FloatingGeo />
        <Particles />
      </Canvas>
    </div>
  );
}
