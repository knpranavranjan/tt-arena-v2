"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Instance, Instances, MeshReflectorMaterial, Sparkles } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Deterministic PRNG (mulberry32) so instance variation is stable across renders instead of reshuffling on every mount. */
function createRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TABLE_TOP_Y = -0.4;
const FLOOR_Y = -0.85;
// The court sits to the right of and behind the hero copy (which is left-aligned),
// far enough back that it reads as an environment, not an object crowding the text.
const RIG_POSITION: [number, number, number] = [1.9, -0.1, -1.9];

// A 3x2 grid of tables, each in its own barriered court — modelled on a multi-table
// competition hall (WTT-style) rather than a single show table.
const GRID_COLS = 3;
const GRID_ROWS = 2;
const COL_SPACING = 1.3;
const ROW_SPACING = 1.75;
const TABLE_W = 0.95;
const TABLE_D = 0.55;
const BARRIER_W = 1.15;
const BARRIER_D = 1.55;

const GRID_HALF_W = COL_SPACING + BARRIER_W / 2;
const GRID_HALF_D = ROW_SPACING / 2 + BARRIER_D / 2;
const STAND_OFFSET = GRID_HALF_W + 0.35;
const STAND_Z_HALF = GRID_HALF_D + 0.5;

/** A soft glowing "light pool" on a surface — a stack of additive discs, always visible regardless of camera angle. */
function GlowPool({ radius = 0.75, color = "#0ea5ff", intensity = 1 }: { radius?: number; color?: string; intensity?: number }) {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
      <mesh>
        <circleGeometry args={[radius * 0.4, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.3 * intensity} toneMapped={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[radius, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.1 * intensity} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** One court: table, net, painted boundary lines, blue dasher-board perimeter and its own glow pool. No ball — static, empty courts read cleanest at this scale. */
function Court({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, TABLE_TOP_Y, 0]}>
        <boxGeometry args={[TABLE_W, 0.03, TABLE_D]} />
        <meshStandardMaterial color="#0f3a66" roughness={0.35} metalness={0.35} />
      </mesh>
      <mesh position={[0, TABLE_TOP_Y + 0.018, 0]}>
        <boxGeometry args={[TABLE_W - 0.03, 0.003, 0.012]} />
        <meshStandardMaterial color="#f4f7fa" toneMapped={false} />
      </mesh>
      <mesh position={[0, TABLE_TOP_Y + 0.018, 0]}>
        <boxGeometry args={[0.012, 0.003, TABLE_D - 0.02]} />
        <meshStandardMaterial color="#f4f7fa" toneMapped={false} />
      </mesh>
      <mesh position={[0, TABLE_TOP_Y + 0.06, 0]}>
        <boxGeometry args={[0.006, 0.1, TABLE_D + 0.02]} />
        <meshStandardMaterial color="#0a0a0f" transparent opacity={0.55} />
      </mesh>

      {/* Painted boundary lines on the court floor. */}
      {[
        [0, -BARRIER_D / 2 + 0.02, BARRIER_W - 0.06, 0.02] as const,
        [0, BARRIER_D / 2 - 0.02, BARRIER_W - 0.06, 0.02] as const,
      ].map(([x, z, w, d], i) => (
        <mesh key={`h${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, TABLE_TOP_Y - 0.34, z]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#f2ede0" roughness={0.8} />
        </mesh>
      ))}
      {[
        [-BARRIER_W / 2 + 0.02, 0, 0.02, BARRIER_D - 0.06] as const,
        [BARRIER_W / 2 - 0.02, 0, 0.02, BARRIER_D - 0.06] as const,
      ].map(([x, z, w, d], i) => (
        <mesh key={`v${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, TABLE_TOP_Y - 0.34, z]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#f2ede0" roughness={0.8} />
        </mesh>
      ))}

      {/* Blue dasher-board perimeter, open at the corners like a real court surround. */}
      {[
        [0, -BARRIER_D / 2, BARRIER_W, 0.03] as const,
        [0, BARRIER_D / 2, BARRIER_W, 0.03] as const,
      ].map(([x, z, w, d], i) => (
        <group key={`bh${i}`}>
          <mesh position={[x, TABLE_TOP_Y - 0.28, z]}>
            <boxGeometry args={[w, 0.13, d]} />
            <meshStandardMaterial color="#0e3f8f" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Sponsor-style accent patch, centered on the board — brand-neutral, not a real logo. */}
          <mesh position={[x, TABLE_TOP_Y - 0.28, z + (i === 0 ? -0.017 : 0.017)]}>
            <boxGeometry args={[w * 0.4, 0.07, 0.004]} />
            <meshStandardMaterial color="#e8f4ff" roughness={0.6} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {[
        [-BARRIER_W / 2, 0, 0.03, BARRIER_D] as const,
        [BARRIER_W / 2, 0, 0.03, BARRIER_D] as const,
      ].map(([x, z, w, d], i) => (
        <mesh key={`bv${i}`} position={[x, TABLE_TOP_Y - 0.28, z]}>
          <boxGeometry args={[w, 0.13, d]} />
          <meshStandardMaterial color="#0e3f8f" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}

      <GlowPool radius={0.85} color="#147dff" intensity={0.6} />
    </group>
  );
}

/** All six courts laid out in a 3x2 grid. */
function CourtGrid() {
  const positions = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        list.push([(c - 1) * COL_SPACING, 0, (r - 0.5) * ROW_SPACING]);
      }
    }
    return list;
  }, []);

  return (
    <>
      {positions.map((pos, i) => (
        <Court key={i} position={pos} />
      ))}
    </>
  );
}

/** A suspended screen panel styled like an arena LED display — used for the main scoreboard and the smaller side screens. */
function Screen({
  position,
  rotationY = 0,
  width = 1.7,
  height = 0.5,
}: {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
}) {
  const stripeCount = 4;
  const stripes = useMemo(
    () => Array.from({ length: stripeCount }, (_, i) => (i / (stripeCount - 1) - 0.5) * (height * 0.7)),
    [height]
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial color="#0a121e" roughness={0.5} metalness={0.4} />
      </mesh>
      {stripes.map((y, i) => (
        <mesh key={i} position={[0, y, 0.045]}>
          <boxGeometry args={[width * 0.88, height * 0.1, 0.005]} />
          <meshStandardMaterial
            color="#0ea5ff"
            emissive="#0ea5ff"
            emissiveIntensity={i % 2 === 0 ? 2.2 : 1.2}
            toneMapped={false}
          />
        </mesh>
      ))}
      {[-width * 0.32, width * 0.32].map((x) => (
        <mesh key={x} position={[x, height * 0.7, 0]}>
          <cylinderGeometry args={[0.015, 0.015, height * 1.4, 8]} />
          <meshStandardMaterial color="#1a2433" roughness={0.6} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

type SeatInstance = { position: [number, number, number]; color: string; scale: number };

// Lower rows read warm (amber, closest to the court), upper rows cool to blue —
// the two-tone banding real competition-hall seating almost always uses.
const SEAT_LOW = { r: 0xc9, g: 0x7a, b: 0x1c };
const SEAT_HIGH = { r: 0x14, g: 0x3a, b: 0x5c };

function mixHex(a: typeof SEAT_LOW, b: typeof SEAT_LOW, t: number) {
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Two straight tiered grandstands flanking the court grid, built from instanced blocks so seat count stays cheap to render. */
function StadiumStands() {
  const seats = useMemo<SeatInstance[]>(() => {
    const rows = 10;
    const seatsPerRow = 16;
    const rowDepthX = 0.17;
    const rowHeight = 0.14;
    const baseY = -0.34;
    const rng = createRng(20260815);

    const list: SeatInstance[] = [];
    for (const side of [-1, 1] as const) {
      for (let r = 0; r < rows; r++) {
        const xOff = side * (STAND_OFFSET + r * rowDepthX);
        const y = baseY + r * rowHeight;
        const rowColor = mixHex(SEAT_LOW, SEAT_HIGH, r / (rows - 1));
        for (let s = 0; s < seatsPerRow; s++) {
          const z = -STAND_Z_HALF + (s / (seatsPerRow - 1)) * STAND_Z_HALF * 2;
          // A sparse scatter of empty (dark) seats breaks up the otherwise-uniform rows.
          const color = rng() < 0.12 ? "#0d1420" : rowColor;
          list.push({ position: [xOff, y, z], color, scale: 0.9 + rng() * 0.2 });
        }
      }
    }
    return list;
  }, []);

  return (
    <Instances limit={seats.length} range={seats.length}>
      <boxGeometry args={[0.14, 0.12, 0.13]} />
      <meshStandardMaterial roughness={0.75} metalness={0.05} toneMapped={false} />
      {seats.map((seat, i) => (
        <Instance key={i} position={seat.position} color={seat.color} scale={seat.scale} />
      ))}
    </Instances>
  );
}

/** A row of abstract accent banners along the very top of each stand — reads as the flag/banner
 * frieze real competition halls hang there, without depicting any specific real flag or sponsor. */
const BANNER_COLORS = ["#147dff", "#0ea5ff", "#e8f4ff", "#1c5a4f", "#c97a1c"];

function StandFlags() {
  const flags = useMemo(() => {
    const rng = createRng(4242);
    const count = 14;
    const rows = 10;
    const topY = -0.34 + (rows - 1) * 0.14 + 0.16;
    const topX = STAND_OFFSET + (rows - 1) * 0.17;
    const list: { position: [number, number, number]; color: string }[] = [];
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < count; i++) {
        const z = -STAND_Z_HALF + (i / (count - 1)) * STAND_Z_HALF * 2;
        list.push({
          position: [side * topX, topY, z],
          color: BANNER_COLORS[Math.floor(rng() * BANNER_COLORS.length)],
        });
      }
    }
    return list;
  }, []);

  return (
    <Instances limit={flags.length} range={flags.length}>
      <planeGeometry args={[0.1, 0.16]} />
      <meshStandardMaterial roughness={0.8} side={2} toneMapped={false} />
      {flags.map((f, i) => (
        <Instance key={i} position={f.position} color={f.color} />
      ))}
    </Instances>
  );
}

/** A low LED ribbon board running along the base of each stand, alternating bright/dim like sponsor signage. */
function LedRibbon() {
  const segments = useMemo(() => {
    const rng = createRng(9001);
    const count = 22;
    const list: { position: [number, number, number]; bright: boolean }[] = [];
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < count; i++) {
        const z = -STAND_Z_HALF + (i / (count - 1)) * STAND_Z_HALF * 2;
        list.push({ position: [side * (STAND_OFFSET - 0.1), TABLE_TOP_Y - 0.5, z], bright: rng() < 0.4 });
      }
    }
    return list;
  }, []);

  return (
    <Instances limit={segments.length} range={segments.length}>
      <boxGeometry args={[0.03, 0.09, 0.14]} />
      <meshStandardMaterial emissive="#147dff" toneMapped={false} />
      {segments.map((seg, i) => (
        <Instance
          key={i}
          position={seg.position}
          color={seg.bright ? "#7fc8ff" : "#0b2c4f"}
          scale={[1, seg.bright ? 1.15 : 0.85, 1]}
        />
      ))}
    </Instances>
  );
}

type PendantInstance = { position: [number, number, number] };

/** A dense grid of hanging globe lights, matching a competition hall's rows of pendant fixtures. Each gets a soft additive halo layered behind the solid core, the same fake-bloom trick used elsewhere, so they read as glowing globes rather than flat dots. */
function PendantLights() {
  const pendants = useMemo<PendantInstance[]>(() => {
    const cols = 12;
    const depths = 8;
    const list: PendantInstance[] = [];
    for (let c = 0; c < cols; c++) {
      for (let d = 0; d < depths; d++) {
        list.push({
          position: [
            -(GRID_HALF_W + 0.7) + (c / (cols - 1)) * (GRID_HALF_W + 0.7) * 2,
            2.35,
            -(STAND_Z_HALF + 0.3) + (d / (depths - 1)) * (STAND_Z_HALF + 0.3) * 2,
          ],
        });
      }
    }
    return list;
  }, []);

  return (
    <>
      <Instances limit={pendants.length} range={pendants.length}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshBasicMaterial color="#ffdf9e" transparent opacity={0.16} toneMapped={false} depthWrite={false} />
        {pendants.map((p, i) => (
          <Instance key={i} position={p.position} />
        ))}
      </Instances>
      <Instances limit={pendants.length} range={pendants.length}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#fff6e6" emissive="#ffe8b8" emissiveIntensity={4.5} toneMapped={false} />
        {pendants.map((p, i) => (
          <Instance key={i} position={p.position} />
        ))}
      </Instances>
      <spotLight
        position={[RIG_POSITION[0] + 0.6, 2.3, RIG_POSITION[2] + 0.8]}
        target-position={[RIG_POSITION[0], TABLE_TOP_Y, RIG_POSITION[2]]}
        angle={0.7}
        penumbra={0.7}
        intensity={58}
        color="#fff2da"
        distance={8}
      />
      <spotLight
        position={[RIG_POSITION[0] - 0.8, 2.2, RIG_POSITION[2] - 0.6]}
        target-position={[RIG_POSITION[0], TABLE_TOP_Y, RIG_POSITION[2]]}
        angle={0.75}
        penumbra={0.8}
        intensity={44}
        color="#cfe6ff"
        distance={8}
      />
    </>
  );
}

/** Ceiling plane to close the space in, so the scene reads as indoors rather than an open void. */
function Ceiling() {
  return (
    <mesh position={[RIG_POSITION[0], 2.75, RIG_POSITION[2]]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 14]} />
      <meshStandardMaterial color="#07090d" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

/** A lattice of structural roof beams just under the ceiling — the crossing steel trusses visible in real competition halls. */
function RoofTruss() {
  const spanX = (GRID_HALF_W + 0.7) * 2;
  const spanZ = (STAND_Z_HALF + 0.3) * 2;
  const beamCountZ = 5;
  const beamCountX = 4;

  return (
    <group position={[RIG_POSITION[0], 2.55, RIG_POSITION[2]]}>
      {Array.from({ length: beamCountZ }, (_, i) => -spanZ / 2 + (i / (beamCountZ - 1)) * spanZ).map((z, i) => (
        <group key={`z${i}`} position={[0, 0, z]}>
          <mesh>
            <boxGeometry args={[spanX, 0.05, 0.05]} />
            <meshStandardMaterial color="#12161e" roughness={0.6} metalness={0.6} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <boxGeometry args={[spanX, 0.006, 0.006]} />
            <meshStandardMaterial color="#3aa8ff" emissive="#3aa8ff" emissiveIntensity={0.8} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: beamCountX }, (_, i) => -spanX / 2 + (i / (beamCountX - 1)) * spanX).map((x, i) => (
        <mesh key={`x${i}`} position={[x, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, spanZ]} />
          <meshStandardMaterial color="#12161e" roughness={0.6} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  useFrame(({ camera, clock }) => {
    const p = scrollRef.current;
    // The canvas is only ever visible while the hero itself is in view, so scale the
    // raw document-scroll progress up — the full camera "reveal" should land well
    // before the hero scrolls out of frame, not at the very bottom of the page.
    const reveal = Math.min(p * 3.2, 1);
    // A slow, near-imperceptible sway so the shot never feels like a frozen render
    // when the visitor isn't actively scrolling — real handheld/crane shots drift.
    const t = clock.elapsedTime;
    const driftX = Math.sin(t * 0.12) * 0.06;
    const driftY = Math.sin(t * 0.09 + 1.4) * 0.035;

    camera.position.y = 1.05 + reveal * 0.9 + driftY;
    camera.position.z = 5.6 + reveal * 2.2;
    camera.position.x = reveal * 0.5 + driftX;
    camera.lookAt(RIG_POSITION[0] - 0.6, TABLE_TOP_Y + 0.2 + reveal * 1.0, RIG_POSITION[2] + reveal * 0.4);
  });
  return null;
}

function ArenaFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]}>
      <planeGeometry args={[40, 40]} />
      <MeshReflectorMaterial
        blur={[200, 50]}
        resolution={512}
        mixBlur={0.6}
        mixStrength={14}
        roughness={0.96}
        depthScale={0.6}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.4}
        color="#a5401f"
        metalness={0.12}
      />
    </mesh>
  );
}

export function ArenaCanvas() {
  const scrollRef = useRef(0);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollRef.current = self.progress;
      },
    });
    return () => trigger.kill();
  }, []);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.7 }}
      camera={{ position: [0, 1.05, 5.6], fov: 48 }}
      className="absolute inset-0"
    >
      <color attach="background" args={["#05070c"]} />
      <fog attach="fog" args={["#05070c", 9, 26]} />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#4a7aa8", "#3a2013", 1.1]} />
      <pointLight position={[RIG_POSITION[0] + 1.4, 2.4, RIG_POSITION[2] + 1.2]} intensity={38} color="#147dff" />
      <pointLight position={[RIG_POSITION[0] - 1.6, 2.1, RIG_POSITION[2] - 0.6]} intensity={30} color="#0ea5ff" />

      <Ceiling />
      <RoofTruss />
      <PendantLights />
      <StadiumStands />
      <StandFlags />
      <LedRibbon />

      <group position={RIG_POSITION}>
        <CourtGrid />
        <Screen position={[0, TABLE_TOP_Y + 2.2, -GRID_HALF_D - 0.35]} width={1.9} height={0.55} />
        <Screen
          position={[-STAND_OFFSET - 0.05, TABLE_TOP_Y + 1.5, 0]}
          rotationY={Math.PI / 2}
          width={1.1}
          height={0.4}
        />
        <Screen
          position={[STAND_OFFSET + 0.05, TABLE_TOP_Y + 1.5, 0]}
          rotationY={-Math.PI / 2}
          width={1.1}
          height={0.4}
        />
      </group>

      <Sparkles
        count={90}
        scale={[GRID_HALF_W * 2 + 2, 3, STAND_Z_HALF * 2]}
        position={[RIG_POSITION[0], 0.6, RIG_POSITION[2]]}
        size={1.3}
        speed={0.2}
        color="#5fc4ff"
        opacity={0.4}
      />

      <ArenaFloor />
      <CameraRig scrollRef={scrollRef} />
    </Canvas>
  );
}
