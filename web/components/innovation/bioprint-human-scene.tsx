"use client";

import {
  Component,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, Center, ContactShadows, Float, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Spherical, Vector3 } from "three";
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

function orbitStep(controls: OrbitControlsImpl, deltaAzimuth: number, zoomMult = 1) {
  const { camera, target } = controls;
  const offset = new Vector3().subVectors(camera.position, target);
  const spherical = new Spherical().setFromVector3(offset);
  spherical.theta += deltaAzimuth;
  if (zoomMult !== 1) spherical.radius *= zoomMult;
  offset.setFromSpherical(spherical);
  camera.position.copy(target).add(offset);
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
    if (group.current && printing) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
  });
  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.1}>
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

function LiverOrgan({ progress, printing, region }: SceneProps) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.12;
  });
  return (
    <group ref={group}>
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
  return (
    <group>
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
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current && printing) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.04;
    }
  });

  return (
    <group ref={group}>
      <Float speed={0.8} rotationIntensity={0.02} floatIntensity={0.05}>
        <mesh position={[0, 0.72, 0]}>
          <sphereGeometry args={[0.17, 32, 32]} />
          <meshStandardMaterial {...SKIN} />
        </mesh>
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

function CameraRig({ region }: { region: AnatomyRegion }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...region.camera.position);
    if ("fov" in camera) {
      camera.fov = region.camera.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, region]);
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
}: SceneProps) {
  const mobile = useIsMobile();
  const cam = region.camera;

  return (
    <>
      <CameraRig region={region} />
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
      <Bounds fit clip observe margin={1.35}>
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
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
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
};

export const BioprintHumanScene = forwardRef<BioprintViewerHandle, BioprintHumanSceneProps>(
  function BioprintHumanScene(
    { region, progress, printing, autoRotate = false, interactive = true, width, height },
    ref
  ) {
    const mobile = useIsMobile();
    const cam = region.camera;
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const initialCam = useRef({ position: cam.position, target: cam.target, fov: cam.fov });

    useEffect(() => {
      initialCam.current = { position: cam.position, target: cam.target, fov: cam.fov };
    }, [cam]);

    useImperativeHandle(ref, () => ({
      resetView() {
        const controls = controlsRef.current;
        if (!controls) return;
        const { camera } = controls;
        camera.position.set(...initialCam.current.position);
        controls.target.set(...initialCam.current.target);
        if ("fov" in camera) {
          camera.fov = initialCam.current.fov;
          camera.updateProjectionMatrix();
        }
        controls.update();
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
    }));

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
          />
        </Canvas>
      </CanvasErrorBoundary>
    );
  }
);
