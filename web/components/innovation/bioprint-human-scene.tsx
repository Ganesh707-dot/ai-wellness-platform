"use client";

import {
  Component,
  useCallback,
  useRef,
  useState,
  useEffect,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, Center, ContactShadows, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Spherical, Vector3, type PerspectiveCamera } from "three";
import type { Group, Mesh } from "three";
import type { AnatomyRegion } from "@/lib/bioprint-anatomy";

const SKIN = { color: "#d4a574", roughness: 0.55, metalness: 0.02 };
const ROTATE_STEP = Math.PI / 8;
const ZOOM_FACTOR = 0.82;

export type BioprintViewerHandle = {
  resetView: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

type SceneProps = {
  region: AnatomyRegion;
  progress: number;
  printing: boolean;
  autoRotate?: boolean;
  interactive?: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
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

/** Programmatic orbit/zoom — syncs OrbitControls internal state so damping does not snap back. */
function orbitStep(controls: OrbitControlsImpl, deltaAzimuth: number, zoomMult = 1) {
  const { object: camera, target } = controls;
  const offset = new Vector3().subVectors(camera.position, target);
  const spherical = new Spherical().setFromVector3(offset);
  spherical.theta += deltaAzimuth;
  if (zoomMult !== 1) {
    spherical.radius = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, spherical.radius * zoomMult)
    );
  }
  offset.setFromSpherical(spherical);
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
  controls.update();
}

function restoreCamera(
  controls: OrbitControlsImpl,
  cameraConfig: AnatomyRegion["camera"],
  camera: PerspectiveCamera
) {
  const target = new Vector3(...cameraConfig.target);
  camera.position.set(...cameraConfig.position);
  camera.fov = cameraConfig.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(target);
  controls.target.copy(target);
  controls.update();
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
    if (!group.current) return;
    const beat = printing ? 1 + Math.sin(state.clock.elapsedTime * 3.2) * 0.05 : 1;
    group.current.scale.setScalar(beat);
  });
  const muscle = { color: "#8b1538", roughness: 0.38, metalness: 0.06 };
  const muscleLight = { color: "#b91c4a", roughness: 0.35 };
  return (
    <group ref={group}>
      <mesh position={[0, -0.06, 0]} scale={[1.05, 1.15, 0.85]}>
        <sphereGeometry args={[0.22, 48, 48]} />
        <meshStandardMaterial {...muscle} />
      </mesh>
      <mesh position={[-0.12, 0.1, 0.04]} scale={[0.75, 0.65, 0.7]}>
        <sphereGeometry args={[0.16, 40, 40]} />
        <meshStandardMaterial {...muscleLight} />
      </mesh>
      <mesh position={[0.1, 0.12, 0.02]} scale={[0.7, 0.6, 0.65]}>
        <sphereGeometry args={[0.15, 40, 40]} />
        <meshStandardMaterial {...muscleLight} />
      </mesh>
      <mesh position={[0.02, 0.28, 0]} rotation={[0.55, 0, 0]}>
        <capsuleGeometry args={[0.05, 0.22, 12, 20]} />
        <meshStandardMaterial color="#fecdd3" roughness={0.28} />
      </mesh>
      <mesh position={[0.08, 0.22, -0.02]} rotation={[0.8, 0.3, 0]}>
        <capsuleGeometry args={[0.035, 0.14, 10, 16]} />
        <meshStandardMaterial color="#fda4af" roughness={0.3} />
      </mesh>
      {progress > 0 && (
        <mesh position={[0.02, 0.02, 0.2]} scale={[1, 1, 0.15 + progress * 0.85]}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshStandardMaterial color="#ef4444" transparent opacity={0.25 + progress * 0.35} emissive="#dc2626" emissiveIntensity={0.3} />
        </mesh>
      )}
      <DepositionGlow
        position={region.position}
        radius={region.radius}
        color={region.color}
        emissive={region.emissive}
        progress={progress}
        printing={printing}
      />
    </group>
  );
}

function LiverOrgan({ progress, printing, region }: SceneProps) {
  const liverMat = { color: "#7c2d12", roughness: 0.42, metalness: 0.05 };
  const liverDark = { color: "#5c1d0a", roughness: 0.45 };
  return (
    <group>
      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.48, 0.05, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0.02, 0.06, 0.04]} scale={[0.55, 0.38, 0.32]}>
        <sphereGeometry args={[0.5, 40, 40]} />
        <meshStandardMaterial {...liverMat} />
      </mesh>
      <mesh position={[-0.22, 0.02, -0.02]} scale={[0.35, 0.28, 0.25]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial {...liverDark} />
      </mesh>
      <mesh position={[0.2, -0.02, 0]} scale={[0.3, 0.22, 0.2]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial {...liverMat} />
      </mesh>
      <mesh position={[-0.08, 0.14, 0.08]} scale={[0.12, 0.2, 0.08]}>
        <capsuleGeometry args={[0.5, 0.3, 8, 16]} />
        <meshStandardMaterial color="#92400e" roughness={0.4} />
      </mesh>
      <DepositionGlow
        position={region.position}
        radius={region.radius}
        color={region.color}
        emissive={region.emissive}
        progress={progress}
        printing={printing}
      />
    </group>
  );
}

function KneeOrgan({ progress, printing, region }: SceneProps) {
  const bone = { color: "#f5f5f4", roughness: 0.42 };
  const cartilage = { color: "#86efac", roughness: 0.32, metalness: 0.05 };
  return (
    <group>
      <mesh position={[0, 0.32, 0]}>
        <capsuleGeometry args={[0.11, 0.32, 16, 32]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.09, 0.34, 16, 32]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0, 0.06, 0.12]} scale={[1.15, 0.6, 0.45]}>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      <mesh position={[0, 0.02, 0.16]} scale={[0.7, 0.35, 0.25]}>
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshStandardMaterial color="#4ade80" roughness={0.28} emissive="#22c55e" emissiveIntensity={printing ? 0.15 : 0.05} />
      </mesh>
      <DepositionGlow
        position={region.position}
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
  const brainMat = { color: "#fda4af", roughness: 0.65, metalness: 0.02 };
  return (
    <group>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.17, 32, 32]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[-0.07, 0.74, 0.03]} scale={[0.9, 1, 0.85]}>
        <sphereGeometry args={[0.1, 28, 28]} />
        <meshStandardMaterial {...brainMat} />
      </mesh>
      <mesh position={[0.07, 0.74, 0.03]} scale={[0.9, 1, 0.85]}>
        <sphereGeometry args={[0.1, 28, 28]} />
        <meshStandardMaterial {...brainMat} />
      </mesh>
      {(
        [
          [-0.05, 0.78, 0.06],
          [0.04, 0.77, 0.07],
          [0, 0.7, 0.08],
        ] as const
      ).map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#fb7185" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.58, 0]}>
        <capsuleGeometry args={[0.055, 0.1, 8, 16]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[0, 0.2, 0]} scale={[0.42, 0.55, 0.22]}>
        <capsuleGeometry args={[0.5, 1, 12, 24]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[-0.32, 0.35, 0.02]} rotation={[0, 0, 0.35]}>
        <capsuleGeometry args={[0.055, 0.38, 10, 20]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[-0.52, 0.02, 0.06]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.048, 0.32, 10, 20]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[0.32, 0.35, 0]} rotation={[0, 0, -0.35]}>
        <capsuleGeometry args={[0.055, 0.38, 10, 20]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[0.52, 0.02, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.048, 0.32, 10, 20]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[-0.12, -0.48, 0]}>
        <capsuleGeometry args={[0.075, 0.52, 12, 24]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      <mesh position={[0.12, -0.48, 0]}>
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
    </group>
  );
}

function BrainOrgan({ progress, printing, region }: SceneProps) {
  const cortex = { color: "#fda4af", roughness: 0.62, metalness: 0.02 };
  const deep = { color: "#fb7185", roughness: 0.58 };
  return (
    <group>
      <mesh position={[-0.14, 0.08, 0]} scale={[0.95, 1.05, 0.88]}>
        <sphereGeometry args={[0.22, 40, 40]} />
        <meshStandardMaterial {...cortex} />
      </mesh>
      <mesh position={[0.14, 0.08, 0]} scale={[0.95, 1.05, 0.88]}>
        <sphereGeometry args={[0.22, 40, 40]} />
        <meshStandardMaterial {...cortex} />
      </mesh>
      <mesh position={[0, 0.1, 0.02]} scale={[1.05, 0.85, 0.75]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial {...deep} />
      </mesh>
      <mesh position={[0, -0.12, -0.06]} scale={[1.1, 0.65, 0.9]}>
        <sphereGeometry args={[0.14, 28, 28]} />
        <meshStandardMaterial color="#f472b6" roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.28, -0.02]}>
        <capsuleGeometry args={[0.05, 0.14, 10, 16]} />
        <meshStandardMaterial color="#fce7f3" roughness={0.45} />
      </mesh>
      {(
        [
          [-0.08, 0.18, 0.1],
          [0.1, 0.16, 0.11],
          [0, 0.2, 0.08],
          [-0.12, 0.04, 0.12],
          [0.12, 0.02, 0.1],
        ] as const
      ).map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.04, 14, 14]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.5} />
        </mesh>
      ))}
      <DepositionGlow
        position={region.position}
        radius={region.radius}
        color={region.color}
        emissive={region.emissive}
        progress={progress}
        printing={printing}
      />
    </group>
  );
}

function KidneyOrgan({ progress, printing, region }: SceneProps) {
  const renal = { color: "#92400e", roughness: 0.48, metalness: 0.04 };
  const cortex = { color: "#b45309", roughness: 0.42 };
  return (
    <group rotation={[0, 0.35, 0]}>
      <mesh position={[-0.12, 0.04, 0]} scale={[0.55, 0.85, 0.7]}>
        <sphereGeometry args={[0.28, 40, 40]} />
        <meshStandardMaterial {...renal} />
      </mesh>
      <mesh position={[0.12, 0.04, 0]} scale={[0.55, 0.85, 0.7]}>
        <sphereGeometry args={[0.28, 40, 40]} />
        <meshStandardMaterial {...renal} />
      </mesh>
      <mesh position={[0, 0.06, 0.08]} scale={[0.35, 0.55, 0.25]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial {...cortex} />
      </mesh>
      <mesh position={[0.18, -0.02, 0.02]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.035, 0.18, 10, 16]} />
        <meshStandardMaterial color="#d97706" roughness={0.4} />
      </mesh>
      <mesh position={[-0.18, -0.02, -0.02]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.03, 0.14, 10, 16]} />
        <meshStandardMaterial color="#d97706" roughness={0.4} />
      </mesh>
      <DepositionGlow
        position={region.position}
        radius={region.radius}
        color={region.color}
        emissive={region.emissive}
        progress={progress}
        printing={printing}
      />
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
    case "brain":
      return <BrainOrgan {...props} />;
    case "kidney":
      return <KidneyOrgan {...props} />;
    default:
      return <ProceduralHuman {...props} />;
  }
}

function CameraRig({ regionId, cameraConfig }: { regionId: string; cameraConfig: AnatomyRegion["camera"] }) {
  const { camera } = useThree();
  useEffect(() => {
    const target = new Vector3(...cameraConfig.target);
    camera.position.set(...cameraConfig.position);
    if ("fov" in camera) {
      camera.fov = cameraConfig.fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(target);
  }, [camera, regionId, cameraConfig]);
  return null;
}

function StudioPlatform() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow>
      <circleGeometry args={[1.4, 64]} />
      <meshStandardMaterial color="#152822" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

function Scene({
  region,
  progress,
  printing,
  autoRotate,
  interactive = true,
  controlsRef,
  boundsRef,
}: SceneProps & { boundsRef: React.RefObject<React.ComponentRef<typeof Bounds> | null> }) {
  const mobile = useIsMobile();
  const cam = region.camera;

  return (
    <>
      <CameraRig regionId={region.id} cameraConfig={region.camera} />
      <color attach="background" args={["#101a18"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 3]} intensity={1.6} castShadow={!mobile} />
      <directionalLight position={[-2, 2, -2]} intensity={0.5} color="#5eead4" />
      <hemisphereLight args={["#b8f5e8", "#0f172a", 0.5]} />
      <StudioPlatform />
      <ContactShadows
        position={[0, -0.54, 0]}
        opacity={0.35}
        scale={3}
        blur={2.5}
        far={1.4}
        color="#000000"
      />
      <Bounds key={region.id} ref={boundsRef} fit clip observe={false} margin={1.35}>
        <Center>
          <OrganSwitch
            region={region}
            progress={progress}
            printing={printing}
            autoRotate={autoRotate}
            interactive={interactive}
            controlsRef={controlsRef}
          />
        </Center>
      </Bounds>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={interactive}
        enableZoom={interactive}
        enableRotate={interactive}
        enablePan={false}
        minDistance={0.5}
        maxDistance={4}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI - 0.2}
        target={cam.target}
        enableDamping={false}
        autoRotate={autoRotate && printing}
        autoRotateSpeed={1.1}
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#101a18] px-6 text-center">
      <p className="text-sm font-medium text-teal-100">3D viewer unavailable</p>
      <p className="text-xs text-teal-100/60">Your browser could not initialize WebGL. Try refreshing.</p>
    </div>
  );
}

type BioprintHumanSceneProps = {
  region: AnatomyRegion;
  progress: number;
  printing: boolean;
  autoRotate?: boolean;
  interactive?: boolean;
  width: number;
  height: number;
  onControlsReady?: (handle: BioprintViewerHandle) => void;
};

export function BioprintHumanScene({
  region,
  progress,
  printing,
  autoRotate = false,
  interactive = true,
  width,
  height,
  onControlsReady,
}: BioprintHumanSceneProps) {
  const mobile = useIsMobile();
  const cam = region.camera;
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const boundsRef = useRef<React.ComponentRef<typeof Bounds>>(null);

  const makeHandle = useCallback((): BioprintViewerHandle => ({
    resetView() {
      const controls = controlsRef.current;
      if (controls) {
        restoreCamera(controls, region.camera, controls.object as PerspectiveCamera);
      }
      // Keep curated per-tissue framing — do not re-run Bounds.fit (zooms to max/clips organ).
    },
    rotateLeft() {
      const controls = controlsRef.current;
      if (controls) orbitStep(controls, ROTATE_STEP);
    },
    rotateRight() {
      const controls = controlsRef.current;
      if (controls) orbitStep(controls, -ROTATE_STEP);
    },
    zoomIn() {
      const controls = controlsRef.current;
      if (controls) orbitStep(controls, 0, ZOOM_FACTOR);
    },
    zoomOut() {
      const controls = controlsRef.current;
      if (controls) orbitStep(controls, 0, 1 / ZOOM_FACTOR);
    },
  }), [region.camera]);

  useEffect(() => {
    let cancelled = false;
    const register = () => {
      if (cancelled) return;
      if (controlsRef.current) {
        onControlsReady?.(makeHandle());
      } else {
        requestAnimationFrame(register);
      }
    };
    register();
    return () => {
      cancelled = true;
    };
  }, [makeHandle, onControlsReady, region.id, width, height]);

  return (
    <CanvasErrorBoundary fallback={<WebGLFallback />}>
      <Canvas
        shadows={!mobile}
        camera={{ position: cam.position, fov: cam.fov }}
        dpr={mobile ? [1, 1.25] : [1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ display: "block", width, height }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        }}
      >
        <Scene
          region={region}
          progress={progress}
          printing={printing}
          autoRotate={autoRotate}
          interactive={interactive}
          controlsRef={controlsRef}
          boundsRef={boundsRef}
        />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
