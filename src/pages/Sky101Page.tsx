import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { api } from "../api";

type SkyCategory = "PLANET" | "CONSTELLATION" | "GALAXY";
type VisualType = "SUN" | "PLANET" | "RINGED_PLANET" | "GALAXY" | "CONSTELLATION";

type SkyShapePoint = {
  x: number;
  y: number;
  z: number;
  size: number;
  colorHex: string;
};

type SkyShapeLink = {
  fromIndex: number;
  toIndex: number;
  colorHex: string;
};

type SkyFacts = {
  distanceFromEarth: string | null;
  diameter: string | null;
  mass: string | null;
  moonCount: number | null;
  funFact: string | null;
};

type SkyObject = {
  id: string;
  name: string;
  category: SkyCategory;
  visualType: VisualType;
  shortDescription: string;
  details: string;
  facts: SkyFacts | null;
  x: number;
  y: number;
  z: number;
  radius: number;
  colorHex: string;
  accentColorHex: string;
  orbitRadius: number | null;
  orbitSpeed: number | null;
  orbitPhase: number | null;
  points: SkyShapePoint[];
  links: SkyShapeLink[];
};

type SkyScene = {
  objects: SkyObject[];
};

type FilterState = Record<SkyCategory, boolean>;

const FILTER_LABELS: Record<SkyCategory, string> = {
  PLANET: "Planets",
  CONSTELLATION: "Constellations",
  GALAXY: "Galaxies",
};

const ORBIT_SPEED_MULTIPLIER = 2.25;

export function Sky101Page() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [sceneData, setSceneData] = useState<SkyScene | null>(null);
  const [selected, setSelected] = useState<SkyObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showConstellationLines, setShowConstellationLines] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    PLANET: true,
    CONSTELLATION: true,
    GALAXY: true,
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<SkyScene>("/api/sky101/scene");
        if (!mounted) return;
        setSceneData(res.data);
      } catch {
        if (!mounted) return;
        setError("Failed to load star map data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleObjects = useMemo(() => {
    return (sceneData?.objects ?? []).filter((obj) => filters[obj.category]);
  }, [sceneData, filters]);

  useEffect(() => {
    if (selected && !filters[selected.category]) {
      setSelected(null);
    }
  }, [filters, selected]);

  useEffect(() => {
    if (!mountRef.current || visibleObjects.length === 0) return;

    const host = mountRef.current;
    const width = host.clientWidth;
    const height = host.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#041129");
    scene.fog = new THREE.FogExp2("#06142f", 0.0017);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2400);
    camera.position.set(0, 26, 96);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 18;
    controls.maxDistance = 300;
    controls.maxPolarAngle = Math.PI * 0.82;

    const ambient = new THREE.AmbientLight(0xcfe2ff, 0.9);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(0xffd07a, 2.8, 900);
    keyLight.position.set(0, 8, 0);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x5ea8ff, 1.1, 1200);
    rimLight.position.set(-120, 90, 120);
    scene.add(rimLight);

    const starField = createStarField();
    scene.add(starField);

    const clickableTargets: THREE.Object3D[] = [];
    const animatedGroups: Array<{ group: THREE.Group; object: SkyObject }> = [];
    const rotatingObjects: THREE.Object3D[] = [];
    const disposableRoots: THREE.Object3D[] = [];

    for (const obj of visibleObjects) {
      const { root, clickTarget } = createVisualObject(obj, showLabels, showConstellationLines);
      scene.add(root);
      disposableRoots.push(root);
      clickableTargets.push(clickTarget);
      if (obj.visualType === "PLANET" || obj.visualType === "RINGED_PLANET") {
        animatedGroups.push({ group: root as THREE.Group, object: obj });
      }
      rotatingObjects.push(...findRotatingChildren(root));
      if (obj.visualType !== "CONSTELLATION" && obj.orbitRadius) {
        scene.add(createOrbitRing(getRenderedOrbitRadius(obj)));
      }
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (evt: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersections = raycaster.intersectObjects(clickableTargets, true);
      if (intersections.length > 0) {
        const hit = intersections[0].object;
        const skyObject = hit.userData.skyObject as SkyObject | undefined;
        if (skyObject) setSelected(skyObject);
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      const time = frame * 0.016;

      for (const { group, object } of animatedGroups) {
        const orbitRadius = getRenderedOrbitRadius(object);
        const orbitSpeed = (object.orbitSpeed ?? 0) * ORBIT_SPEED_MULTIPLIER;
        const phase = object.orbitPhase ?? 0;
        group.position.set(
          Math.cos(time * orbitSpeed + phase) * orbitRadius,
          Math.sin(time * orbitSpeed * 0.75 + phase) * 1.1,
          Math.sin(time * orbitSpeed + phase) * orbitRadius * 0.46,
        );
      }

      for (const rotator of rotatingObjects) {
        rotator.rotation.y += 0.004;
      }

      controls.update();
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const nextW = host.clientWidth;
      const nextH = host.clientHeight;
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.cancelAnimationFrame(raf);
      controls.dispose();
      for (const obj of disposableRoots) {
        disposeObject(obj);
      }
      disposeObject(starField);
      renderer.dispose();
      if (host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [visibleObjects, showLabels, showConstellationLines]);

  const selectedCategoryTone = useMemo(() => {
    if (!selected) return "text-slate-300";
    if (selected.category === "PLANET") return "text-cyan-200";
    if (selected.category === "CONSTELLATION") return "text-amber-200";
    return "text-emerald-200";
  }, [selected]);

  const selectedFactCards = useMemo(() => {
    if (!selected?.facts) return [];

    return [
      { label: "Distance from Earth", value: selected.facts.distanceFromEarth },
      { label: "Diameter", value: selected.facts.diameter },
      { label: "Mass", value: selected.facts.mass },
      {
        label: "Known moons",
        value:
          selected.facts.moonCount === null || selected.facts.moonCount === undefined
            ? null
            : String(selected.facts.moonCount),
      },
    ].filter((item): item is { label: string; value: string } => Boolean(item.value));
  }, [selected]);

  function toggleFilter(category: SkyCategory) {
    setFilters((prev) => ({ ...prev, [category]: !prev[category] }));
  }

  return (
    <section className="mx-auto w-full max-w-[92rem] space-y-5">
      <header className="glass-panel px-5 py-6 sm:px-6 sm:py-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="label-muted text-slate-400">Sky 101</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-slate-50 sm:text-5xl">
              Interactive Star Map Classroom
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              Explore a solar-system style teaching map, watch the planets orbit the Sun, and inspect famous celestial objects through a cleaner mission-brief layout.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/35 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Field Guide</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Drag to rotate, scroll to zoom, and select any object to inspect its profile and science facts.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="glass-panel-strong p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(["PLANET", "CONSTELLATION", "GALAXY"] as SkyCategory[]).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleFilter(category)}
                className={filters[category] ? "btn-primary" : "btn-ghost"}
              >
                {FILTER_LABELS[category]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowLabels((prev) => !prev)}
              className={showLabels ? "btn-primary" : "btn-ghost"}
            >
              {showLabels ? "Labels on" : "Labels off"}
            </button>
            <button
              type="button"
              onClick={() => setShowConstellationLines((prev) => !prev)}
              className={showConstellationLines ? "btn-primary" : "btn-ghost"}
            >
              {showConstellationLines ? "Constellation lines on" : "Constellation lines off"}
            </button>
          </div>

          {loading && <p className="p-4 text-sm text-slate-300">Loading star map...</p>}
          {error && <p className="p-4 text-sm text-red-300">{error}</p>}
          {!loading && !error && (
            <div ref={mountRef} className="h-[42rem] w-full overflow-hidden rounded-xl border border-slate-700/70 sm:h-[52rem]" />
          )}

          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">Solar system motion is animated. Constellations and galaxies stay fixed for study.</p>
        </div>

        <aside className="glass-panel-strong p-4 sm:p-5 xl:sticky xl:top-28 xl:self-start">
          <p className="label-muted text-slate-400">Selected Object</p>
          <h2 className="mt-2 text-[2rem] font-semibold text-slate-50">Object Info</h2>
          {!selected && (
            <p className="mt-4 max-w-prose text-base leading-7 text-slate-300">
              Start with the Sun, Jupiter, Orion, Sagittarius, Andromeda, and the Milky Way to get a quick overview of the night sky.
            </p>
          )}
          {selected && (
            <div className="mt-4 space-y-5 rounded-[1.6rem] border border-slate-700/70 bg-[linear-gradient(180deg,rgba(4,14,32,0.94),rgba(5,16,38,0.88))] p-5 shadow-[0_24px_80px_rgba(2,8,23,0.34)] sm:p-6">
              <div className="space-y-3 border-b border-slate-700/70 pb-5">
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${selectedCategoryTone}`}>{selected.category}</p>
                <h3 className="text-3xl font-semibold text-slate-50 sm:text-[2.25rem]">{selected.name}</h3>
                <p className="max-w-prose text-base leading-8 text-slate-300">{selected.shortDescription}</p>
              </div>
              {selectedFactCards.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3">
                  {selectedFactCards.map((item) => (
                    <div key={item.label} className="flex min-h-[7.5rem] flex-col justify-between rounded-[1.25rem] border border-slate-700/60 bg-[linear-gradient(180deg,rgba(2,12,28,0.86),rgba(4,18,43,0.72))] p-4">
                      <p className="max-w-[12rem] text-[11px] font-semibold uppercase leading-5 tracking-[0.16em] text-slate-500">{item.label}</p>
                      <p className="mt-4 text-lg font-semibold leading-7 text-slate-100">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="max-w-prose text-base leading-8 text-slate-400">{selected.details}</p>
              {selected.facts?.funFact && (
                <div className="rounded-[1.25rem] border border-cyan-400/25 bg-cyan-400/8 p-4 text-base leading-8 text-cyan-50">
                  <span className="mr-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Fun fact</span>
                  {selected.facts.funFact}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function createVisualObject(obj: SkyObject, showLabels: boolean, showConstellationLines: boolean) {
  const root = new THREE.Group();
  root.position.set(obj.x, obj.y, obj.z);
  const label = showLabels ? createLabelSprite(obj.name, obj.category) : null;

  if (obj.visualType === "SUN") {
    const sunMaterial = createSunMaterial(obj.colorHex, obj.accentColorHex);
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(obj.radius, 36, 36),
      sunMaterial
    );
    sun.userData.rotating = true;
    sun.userData.skyObject = obj;
    root.add(sun);
    const corona = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createSunCoronaTexture(obj.colorHex, obj.accentColorHex),
        color: new THREE.Color(obj.accentColorHex),
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    corona.scale.set(obj.radius * 5.2, obj.radius * 5.2, 1);
    root.add(corona);
    root.add(createGlow(obj.radius * 4.8, obj.accentColorHex, 0.4));
    root.add(createGlow(obj.radius * 3.1, obj.colorHex, 0.55));
    if (label) {
      label.position.set(0, -obj.radius - 1.8, 0);
      root.add(label);
    }
    return { root, clickTarget: sun as THREE.Object3D };
  }

  if (obj.visualType === "PLANET" || obj.visualType === "RINGED_PLANET") {
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: createPlanetTexture(obj.colorHex, obj.accentColorHex),
      roughness: 0.84,
      metalness: 0.05,
    });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(obj.radius, 32, 32), planetMaterial);
    planet.userData.rotating = true;
    planet.userData.skyObject = obj;
    root.add(planet);
    if (obj.visualType === "RINGED_PLANET") {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(obj.radius * 1.45, obj.radius * 2.15, 64),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(obj.accentColorHex), transparent: true, opacity: 0.65, side: THREE.DoubleSide })
      );
      ring.rotation.x = Math.PI * 0.35;
      ring.rotation.y = Math.PI * 0.2;
      root.add(ring);
    }
    root.add(createGlow(obj.radius * 2.2, obj.colorHex, 0.18));
    if (label) {
      label.position.set(0, -obj.radius - 1.2, 0);
      root.add(label);
    }
    return { root, clickTarget: planet as THREE.Object3D };
  }

  if (obj.visualType === "GALAXY") {
    const galaxy = createGalaxyVisual(obj);
    galaxy.userData.skyObject = obj;
    galaxy.userData.rotating = true;
    root.add(galaxy);
    const clickSphere = new THREE.Mesh(
      new THREE.SphereGeometry(obj.radius * 1.4, 18, 18),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    clickSphere.userData.skyObject = obj;
    root.add(clickSphere);
    if (label) {
      label.position.set(0, -obj.radius - 1.8, 0);
      root.add(label);
    }
    return { root, clickTarget: clickSphere as THREE.Object3D };
  }

  const constellation = createConstellationVisual(obj, showConstellationLines);
  root.add(constellation);
  const clickSphere = new THREE.Mesh(
    new THREE.SphereGeometry(obj.radius, 18, 18),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  clickSphere.userData.skyObject = obj;
  root.add(clickSphere);
  if (label) {
    label.position.set(0, -obj.radius - 1.4, 0);
    root.add(label);
  }
  return { root, clickTarget: clickSphere as THREE.Object3D };
}

function createGalaxyVisual(obj: SkyObject) {
  const group = new THREE.Group();
  const particleCount = 260;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const primary = new THREE.Color(obj.colorHex);
  const accent = new THREE.Color(obj.accentColorHex);

  for (let i = 0; i < particleCount; i += 1) {
    const ratio = i / particleCount;
    const arm = i % 2 === 0 ? 0 : Math.PI;
    const angle = ratio * Math.PI * 4.4 + arm;
    const radius = ratio * obj.radius * 3.5;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1.1;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.55;
    const mixed = primary.clone().lerp(accent, ratio);
    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 0.36, vertexColors: true, transparent: true, opacity: 0.9 });
  const points = new THREE.Points(geometry, material);
  group.add(points);
  group.add(createGlow(obj.radius * 4.8, obj.accentColorHex, 0.28));
  return group;
}

function createConstellationVisual(obj: SkyObject, showLines: boolean) {
  const group = new THREE.Group();
  const starMeshes: THREE.Object3D[] = [];
  for (const point of obj.points) {
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(point.size, 18, 18),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(point.colorHex) })
    );
    star.position.set(point.x, point.y, point.z);
    group.add(star);
    group.add(createGlow(point.size * 5, point.colorHex, 0.18, star.position));
    starMeshes.push(star);
  }

  if (showLines && obj.links.length > 0) {
    for (const line of obj.links) {
      const from = obj.points[line.fromIndex];
      const to = obj.points[line.toIndex];
      if (!from || !to) continue;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(from.x, from.y, from.z),
        new THREE.Vector3(to.x, to.y, to.z),
      ]);
      const material = new THREE.LineBasicMaterial({ color: new THREE.Color(line.colorHex), transparent: true, opacity: 0.7 });
      group.add(new THREE.Line(geometry, material));
    }
  }

  return group;
}

function createOrbitRing(radius: number) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.42, 0, Math.PI * 2);
  const points = curve.getPoints(180).map((p) => new THREE.Vector3(p.x, 0, p.y));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0x234477, transparent: true, opacity: 0.48 });
  return new THREE.LineLoop(geometry, material);
}

function getRenderedOrbitRadius(obj: SkyObject) {
  if (!obj.orbitRadius) return 0;
  if (obj.id === "mercury") return obj.orbitRadius + 4;
  return obj.orbitRadius;
}

function createGlow(scale: number, colorHex: string, opacity: number, position?: THREE.Vector3) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialTexture(colorHex),
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity,
      depthWrite: false,
    })
  );
  sprite.scale.set(scale, scale, 1);
  if (position) sprite.position.copy(position);
  return sprite;
}

function createLabelSprite(text: string, category: SkyCategory) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.Sprite();
  }
  const color = category === "PLANET" ? "#f7f0d7" : category === "CONSTELLATION" ? "#ffd36e" : "#b9d3ff";
  ctx.font = "600 42px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 12;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(12, 3, 1);
  return sprite;
}

function createPlanetTexture(primaryHex: string, accentHex: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  const primary = new THREE.Color(primaryHex);
  const accent = new THREE.Color(accentHex);
  ctx.fillStyle = `#${primary.getHexString()}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 9; i += 1) {
    const y = (canvas.height / 9) * i;
    const ratio = i / 8;
    const mixed = primary.clone().lerp(accent, ratio * 0.85);
    ctx.fillStyle = `rgba(${Math.round(mixed.r * 255)}, ${Math.round(mixed.g * 255)}, ${Math.round(mixed.b * 255)}, 0.9)`;
    ctx.fillRect(0, y, canvas.width, canvas.height / 14 + (i % 2) * 5);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSunMaterial(primaryHex: string, accentHex: string) {
  return new THREE.MeshStandardMaterial({
    map: createSunTexture(primaryHex, accentHex),
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 1.25,
    roughness: 0.72,
    metalness: 0,
  });
}

function createSunTexture(primaryHex: string, accentHex: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const primary = new THREE.Color(primaryHex);
  const accent = new THREE.Color(accentHex);
  const fill = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  fill.addColorStop(0, `#${accent.getHexString()}`);
  fill.addColorStop(0.45, `#${primary.getHexString()}`);
  fill.addColorStop(1, "#ff8d3a");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 18; i += 1) {
    const y = (canvas.height / 18) * i;
    const alpha = 0.11 + (i % 3) * 0.035;
    ctx.fillStyle = `rgba(255, 236, 186, ${alpha})`;
    ctx.fillRect(0, y, canvas.width, 8 + (i % 4) * 3);
  }

  for (let i = 0; i < 42; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 4 + Math.random() * 16;
    const burst = ctx.createRadialGradient(x, y, 1, x, y, radius);
    burst.addColorStop(0, "rgba(255,249,213,0.95)");
    burst.addColorStop(0.35, "rgba(255,195,87,0.42)");
    burst.addColorStop(1, "rgba(255,120,30,0)");
    ctx.fillStyle = burst;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSunCoronaTexture(primaryHex: string, accentHex: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const gradient = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
  gradient.addColorStop(0, "rgba(255,245,214,0.96)");
  gradient.addColorStop(0.22, `${accentHex}cc`);
  gradient.addColorStop(0.5, `${primaryHex}66`);
  gradient.addColorStop(1, "rgba(255,130,40,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "rgba(255,231,173,0.34)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 28; i += 1) {
    const angle = (Math.PI * 2 * i) / 28;
    const inner = 118 + (i % 3) * 8;
    const outer = 220 + (i % 4) * 18;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(angle) * inner, 256 + Math.sin(angle) * inner);
    ctx.lineTo(256 + Math.cos(angle) * outer, 256 + Math.sin(angle) * outer);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function createRadialTexture(colorHex: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  gradient.addColorStop(0, colorHex);
  gradient.addColorStop(0.35, `${colorHex}cc`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function createStarField() {
  const geometry = new THREE.BufferGeometry();
  const count = 3600;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 1000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 700;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xdce8ff, size: 0.72, transparent: true, opacity: 0.86 })
  );
}

function findRotatingChildren(root: THREE.Object3D) {
  const result: THREE.Object3D[] = [];
  root.traverse((child) => {
    if (child.userData.rotating) {
      result.push(child);
    }
  });
  return result;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
    } else {
      material?.dispose();
    }
  });
}
