"use client";

import { Component, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import type { Group, Mesh } from "three";
import type { AnatomyRegion } from "@/lib/bioprint-anatomy";

const SKIN = { color: "#d4a574", roughness: 0.55, metalness: 0.02 };

type SceneProps = {
  region: AnatomyRegion;
  progress: number;
  printing: boolean;
  immersive?: boolean;
};

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

function DepositionGlow({
  position,
  radius,
  color,
  emissive,
  progress,
  printing,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  emissive: string;
  progress: number;
  printing: boolean;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as { emissiveIntensity?: number };
    const t = state.clock.elapsedTime;
    mat.emissiveIntensity = (printing ? 0.7 + Math.sin(t * 4) * 0.2 : 0.45) * (0.5 + progress * 0.5);
  });
  const scale = 0.35 + progress * 0.85;
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.6}
        transparent
        opacity={0.5 + progress * 0.4}
        roughness={0.2}
      />
    </mesh>
  );
}

function HeartOrgan({ progress, printing, region }: SceneProps) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current && printing) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
    }
  });
  return (
    <group ref={group} scale={2.2}>
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
        <mesh position={[-0.1, 0, 0]} scale={[0.85, 1.15, 0.9]}>
          <sphereGeometry args={[0.24, 48, 48]} />
          <meshStandardMaterial color="#7f1d3a" roughness={0.32} metalness={0.08} />
        </mesh>
        <mesh position={[0.12, 0.05, 0.08]} scale={[0.75, 1, 0.8]}>
          <sphereGeometry args={[0.2, 48, 48]} />
          <meshStandardMaterial color="#9f1239" roughness={0.35} />
        </mesh>
        <mesh position={[0.02, 0.32, 0]} rotation={[0.45, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.28, 20]} />
          <meshStandardMaterial color="#fecdd3" roughness={0.25} />
        </mesh>
        <DepositionGlow
          position={[0.02, 0.08, 0.22]}
          radius={region.radius}
          color={region.color}
          emissive={region.emissive}
          progress={progress}
          printing={printing}
        />
      </Float>
    </group>
  );
}

function LiverOrgan({ progress, printing, region }: SceneProps) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.15;
  });
  return (
    <group ref={group} scale={2}>
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.9, 0.55, 0.06]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.35} />
      </mesh>
      {(
        [
          [0, 0.08, 0.05, 0.28, 0.22, 0.18],
          [-0.18, 0, -0.05, 0.2, 0.16, 0.14],
          [0.16, -0.02, 0, 0.18, 0.14, 0.12],
        ] as const
      ).map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} position={[x, y, z]} scale={[sx, sy, sz]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#854d0e" roughness={0.4} />
        </mesh>
      ))}
      <DepositionGlow
        position={[0, 0.1, 0.15]}
        radius={region.radius * 0.85}
        color={region.color}
        emissive={region.emissive}
        progress={progress}
        printing={printing}
      />
    </group>
  );
}

function KneeOrgan({ progress, printing, region }: SceneProps) {
  return (
    <group scale={2.1}>
      <mesh position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.12, 0.35, 12, 24]} />
        <meshStandardMaterial color="#e7e5e4" roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <capsuleGeometry args={[0.1, 0.38, 12, 24]} />
        <meshStandardMaterial color="#e7e5e4" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.08, 0.14]} scale={[1.1, 0.55, 0.35]}>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.35} />
      </mesh>
      <DepositionGlow
        position={[0, 0.05, 0.18]}
        radius={region.radius}
        color={region.color}
        emissive={region.emissive}
        progress={progress}
        printing={printing}
      />
    </group>
  );
}

function ProceduralHuman({ region, progress, printing }: SceneProps) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current && printing) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.06;
    }
  });

  return (
    <group ref={group} position={[0, -0.95, 0]} scale={1.05}>
      <Float speed={1} rotationIntensity={0.04} floatIntensity={0.12}>
        {/* Head */}
        <mesh position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.17, 32, 32]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 1.38, 0]}>
          <capsuleGeometry args={[0.055, 0.1, 8, 16]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 0.95, 0]} scale={[0.42, 0.55, 0.22]}>
          <capsuleGeometry args={[0.5, 1, 12, 24]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        {/* Left arm (forearm graft zone) */}
        <mesh position={[-0.38, 1.02, 0.04]} rotation={[0, 0, 0.35]}>
          <capsuleGeometry args={[0.055, 0.38, 10, 20]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        <mesh position={[-0.52, 0.62, 0.06]} rotation={[0, 0, 0.15]}>
          <capsuleGeometry args={[0.048, 0.32, 10, 20]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        {/* Right arm */}
        <mesh position={[0.38, 1.02, 0]} rotation={[0, 0, -0.35]}>
          <capsuleGeometry args={[0.055, 0.38, 10, 20]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        <mesh position={[0.52, 0.62, 0]} rotation={[0, 0, -0.15]}>
          <capsuleGeometry args={[0.048, 0.32, 10, 20]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.14, 0.28, 0]}>
          <capsuleGeometry args={[0.075, 0.52, 12, 24]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        <mesh position={[0.14, 0.28, 0]}>
          <capsuleGeometry args={[0.075, 0.52, 12, 24]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
        <DepositionGlow
          position={region.position}
          radius={region.radius}
          color={region.color}
          emissive={region.emissive}
          progress={progress}
          printing={printing}
        />
      </Float>
    </group>
  );
}

function OrganSwitch(props: SceneProps) {
  switch (props.region.organ) {
    case "heart":
      return <HeartOrgan {...props} />;
    case "liver":
      return <LiverOrgan {...props} />;
    case "knee":
      return <KneeOrgan {...props} />;
    default:
      return <ProceduralHuman {...props} />;
  }
}

function Scene({ region, progress, printing, immersive }: SceneProps) {
  const mobile = useIsMobile();
  return (
    <>
      <color attach="background" args={["#030a09"]} />
      <fog attach="fog" args={["#030a09", immersive ? 6 : 4, 12]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 5]} intensity={1.35} castShadow={!mobile} />
      <directionalLight position={[-3, 2, -2]} intensity={0.45} color="#5eead4" />
      <pointLight position={[0, 1.2, 2]} intensity={0.5} color="#34d399" />
      <hemisphereLight args={["#99f6e4", "#0f172a", 0.35]} />
      <OrganSwitch region={region} progress={progress} printing={printing} immersive={immersive} />
      <OrbitControls
        enablePan={false}
        minDistance={region.organ === "human" ? 1.2 : 0.85}
        maxDistance={region.organ === "human" ? 3.5 : 2.8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.65}
        target={region.camera.target}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
}

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function WebGLFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#030a09] px-6 text-center">
      <p className="text-sm font-medium text-teal-100">3D viewer unavailable</p>
      <p className="text-xs text-teal-100/60">Your browser could not initialize WebGL. Try refreshing.</p>
    </div>
  );
}

export function BioprintHumanScene({
  region,
  progress,
  printing,
  immersive = false,
}: SceneProps) {
  const mobile = useIsMobile();
  const cam = region.camera;

  return (
    <CanvasErrorBoundary fallback={<WebGLFallback />}>
      <Canvas
        shadows={!mobile}
        camera={{ position: cam.position, fov: cam.fov }}
        dpr={mobile ? [1, 1.25] : [1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        }}
      >
        <Scene region={region} progress={progress} printing={printing} immersive={immersive} />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
