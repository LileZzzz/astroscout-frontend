export type SkyCategory = "PLANET" | "CONSTELLATION" | "GALAXY";
export type VisualType = "SUN" | "PLANET" | "RINGED_PLANET" | "GALAXY" | "CONSTELLATION";

export type SkyShapePoint = {
  x: number;
  y: number;
  z: number;
  size: number;
  colorHex: string;
};

export type SkyShapeLink = {
  fromIndex: number;
  toIndex: number;
  colorHex: string;
};

export type SkyFacts = {
  distanceFromEarth: string | null;
  diameter: string | null;
  mass: string | null;
  moonCount: number | null;
  funFact: string | null;
};

export type SkyObject = {
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

export type SkyScene = {
  objects: SkyObject[];
};

export const FILTER_LABELS: Record<SkyCategory, string> = {
  PLANET: "Planets",
  CONSTELLATION: "Constellations",
  GALAXY: "Galaxies",
};
