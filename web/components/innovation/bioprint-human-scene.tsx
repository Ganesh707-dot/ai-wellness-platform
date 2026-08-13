"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import type { Group, Mesh } from "three";
import type { AnatomyRegion } from "@/lib/bioprint-anatomy";

type SceneProps = {
  region: AnatomyRegion;
  progress: number;
  printing: boolean;
  compact?: boolean;
};

function SkinMaterial({ opacity = 0.92 }: { opacity?: number }) {
  return (
    <meshStandardMaterial
      color="#d4b896"
      roughness={0.55}
      metalness={0.05}
      transparent
      opacity={opacity}
    />
  );
}

/** Procedural anatomical human — enterprise-style body rig (no external GLB dependency). */
function AnatomicalHuman({ region, progress, printing }: SceneProps) {
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);
  const nozzleRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current && printing) {
      groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.08;
    }
    if (glowRef.current) {
      const pulse = printing ? 0.55 + Math.sin(t * 4) * 0.15 : 0.35;
      const mat = glowRef.current.material as { emissiveIntensity?: number };
      if (mat) mat.emissiveIntensity = pulse * (0.4 + progress * 0.6);
    }
    if (nozzleRef.current && printing) {
      nozzleRef.current.position.x = region.position[0] + Math.sin(t * 3) * 0.04;
      nozzleRef.current.position.y = region.position[1] + Math.cos(t * 2.5) * 0.03;
      nozzleRef.current.position.z = region.position[2] + 0.18;
    }
  });

  const glowScale = 0.25 + progress * 0.75;

  return (
    <group ref={groupRef} position={[0, -0.95, 0]}>
      {/* Head */}
      <mesh position={[0, 1.68, 0]} castShadow>
        <sphereGeometry args={[0.17, 32, 32]} />
        <SkinMaterial />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 20]} />
        <SkinMaterial />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.52, 12, 24]} />
        <SkinMaterial />
      </mesh>
      {/* Pelvis */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.18, 8, 16]} />
        <SkinMaterial />
      </mesh>
      {/* Left arm */}
      <mesh position={[0.34, 1.22, 0]} rotation={[0, 0, -0.35]} castShadow>
        <capsuleGeometry args={[0.07, 0.38, 8, 16]} />
        <SkinMaterial />
      </mesh>
      <mesh position={[0.48, 0.88, 0.04]} rotation={[0, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.06, 0.34, 8, 16]} />
        <SkinMaterial />
      </mesh>
      {/* Right arm */}
      <mesh position={[-0.34, 1.22, 0]} rotation={[0, 0, 0.35]} castShadow>
        <capsuleGeometry args={[0.07, 0.38, 8, 16]} />
        <SkinMaterial />
      </mesh>
      <mesh position={[-0.48, 0.88, 0.04]} rotation={[0, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.06, 0.34, 8, 16]} />
        <SkinMaterial />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.13, 0.38, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.42, 8, 16]} />
        <SkinMaterial />
      </mesh>
      <mesh position={[-0.13, -0.02, 0.04]} castShadow>
        <capsuleGeometry args={[0.07, 0.38, 8, 16]} />
        <SkinMaterial />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.13, 0.38, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.42, 8, 16]} />
        <SkinMaterial />
      </mesh>
      <mesh position={[0.13, -0.02, 0.04]} castShadow>
        <capsuleGeometry args={[0.07, 0.38, 8, 16]} />
        <SkinMaterial />
      </mesh>

      {/* Inner anatomy hint (semi-transparent) */}
      <mesh position={[0.04, 1.15, 0.1]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshStandardMaterial color="#7f1d1d" transparent opacity={0.25} roughness={0.4} />
      </mesh>
      <mesh position={[0.1, 1.0, 0.08]}>
        <sphereGeometry args={[0.11, 24, 24]} />
        <meshStandardMaterial color="#713f12" transparent opacity={0.2} roughness={0.4} />
      </mesh>

      {/* Bioprint deposition zone — grows with layer progress */}
      <mesh ref={glowRef} position={region.position} scale={glowScale}>
        <sphereGeometry args={[region.radius, 32, 32]} />
        <meshStandardMaterial
          color={region.color}
          emissive={region.emissive}
          emissiveIntensity={0.5}
          transparent
          opacity={0.55 + progress * 0.35}
          roughness={0.25}
        />
      </mesh>

      {/* Layer rings — enterprise deposition visualization */}
      {progress > 0.05 &&
        [0.35, 0.55, 0.75, 1].filter((s) => s <= progress + 0.05).map((s, i) => (
          <mesh
            key={i}
            position={region.position}
            rotation={[Math.PI / 2, 0, i * 0.4]}
            scale={s}
          >
            <torusGeometry args={[region.radius * 0.85, 0.004, 8, 48]} />
            <meshBasicMaterial color={region.emissive} transparent opacity={0.5} />
          </mesh>
        ))}

      {/* Extrusion nozzle during active print */}
      {printing && progress > 0 && (
        <group ref={nozzleRef} position={[region.position[0], region.position[1], region.position[2] + 0.2]}>
          <mesh>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#5eead4" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.008, 0.003, 0.1, 8]} />
            <meshStandardMaterial color="#99f6e4" emissive="#2dd4bf" emissiveIntensity={1.2} transparent opacity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Scene({ region, progress, printing }: SceneProps) {
  return (
    <>
      <color attach="background" args={["#0a2824"]} />
      <fog attach="fog" args={["#0a2824", 4, 9]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} castShadow shadow-mapSize={[512, 512]} />
      <directionalLight position={[-2, 2, -2]} intensity={0.35} color="#5eead4" />
      <pointLight position={[0, 1.5, 1]} intensity={0.6} color="#34d399" />
      <AnatomicalHuman region={region} progress={progress} printing={printing} />
      <ContactShadows position={[0, -0.95, 0]} opacity={0.45} scale={3} blur={2.5} far={2} />
      <Environment preset="city" />
      <OrbitControls
        enablePan={false}
        minDistance={1.4}
        maxDistance={4.2}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 1.05, 0]}
      />
    </>
  );
}

export function BioprintHumanScene({
  region,
  progress,
  printing,
  compact = false,
}: SceneProps) {
  const cameraPos: [number, number, number] = compact ? [0.5, 1.25, 2.2] : [0.65, 1.35, 2.5];

  return (
    <Canvas
      shadows
      camera={{ position: cameraPos, fov: 42 }}
      dpr={[1, compact ? 1.5 : 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <Scene region={region} progress={progress} printing={printing} />
    </Canvas>
  );
}
