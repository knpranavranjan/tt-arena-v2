/**
 * Pure helpers for turning CLUB sign-up input into a full club profile.
 * No React / no server imports.
 */
import type { Club, ClubFacilities } from "@/lib/types";
import { stateFromLocation } from "@/lib/player-profile";

export interface ClubProfileInput {
  location?: string;
  address?: string;
  state?: string;
  description?: string;
  founded?: number | string;
  phone?: string;
  email?: string;
  coordinates?: { lat: number; lng: number } | null;
  facilities?: Partial<ClubFacilities>;
  /** Short bullet points shown on the public club page. */
  aboutHighlights?: string[];
}

export const defaultFacilities: ClubFacilities = {
  tableCount: 0,
  tableVarieties: "",
  floorType: "",
  floorGrade: "",
  lighting: "",
  isAirConditioned: false,
  hasWashroom: false,
  hasParking: false,
  hasROWater: false,
  seatingCapacity: 0,
};

export function isClubProfileComplete(input: {
  state?: string | null;
  location?: string | null;
  founded?: number | string | null;
}): boolean {
  const founded = Number(input.founded);
  return Boolean(
    (stateFromLocation(input.state) || stateFromLocation(input.location)) &&
      Number.isFinite(founded) &&
      founded > 1900,
  );
}

/** Build a full `Club` from an account + whatever profile input we have. */
export function buildClub(args: {
  id: string;
  name: string;
  input?: ClubProfileInput;
}): Club & { profileComplete: boolean } {
  const input = args.input ?? {};
  const location = input.location ?? "";
  const state = stateFromLocation(input.state) || stateFromLocation(location);
  const founded = Number(input.founded) || 0;
  return {
    id: args.id,
    name: args.name,
    location: location.split(",")[0]?.trim() || location,
    state,
    address: input.address ?? location,
    coordinates: input.coordinates ?? undefined,
    description: input.description ?? "",
    aboutHighlights: input.aboutHighlights ?? [],
    logoUrl: undefined,
    playerIds: [],
    founded,
    phone: input.phone ?? "",
    email: input.email ?? "",
    verified: false,
    facilities: { ...defaultFacilities, ...(input.facilities ?? {}) },
    profileComplete: isClubProfileComplete({ state, location, founded }),
  };
}
