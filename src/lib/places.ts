import { supabase } from "@/integrations/supabase/client";
import { NIGERIAN_STATES, inferStateAndLga } from "./nigeria";

/**
 * Location lookup.
 *
 * Google Places is proxied through the `places` Edge Function so the API key
 * stays server-side. Every call falls back to the built-in Nigerian gazetteer
 * (37 states, their capitals and all their LGAs) when the key is absent, the
 * quota is exhausted, or the network is unavailable — so location fields keep
 * working in the field, which is where they matter most.
 */

export interface PlaceSuggestion {
  id: string;
  label: string;
  secondary?: string;
  latitude?: number;
  longitude?: number;
  state?: string;
  lga?: string;
  source: "google" | "gazetteer";
}

export interface ResolvedPlace {
  address: string;
  latitude?: number;
  longitude?: number;
  state?: string;
  lga?: string;
}

/** Ranked matches from the offline gazetteer: LGAs, states and capitals. */
export function gazetteerSearch(query: string, limit = 6): PlaceSuggestion[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const hits: PlaceSuggestion[] = [];

  for (const state of NIGERIAN_STATES) {
    for (const lga of state.lgas) {
      if (lga.toLowerCase().includes(needle)) {
        hits.push({
          id: `gz:${state.name}:${lga}`,
          label: `${lga} LGA`,
          secondary: `${state.name} · ${state.zone}`,
          state: state.name,
          lga,
          source: "gazetteer",
        });
      }
    }

    if (state.name.toLowerCase().includes(needle) || state.capital.toLowerCase().includes(needle)) {
      hits.push({
        id: `gz:${state.name}:`,
        label:
          state.name === "Federal Capital Territory"
            ? "Federal Capital Territory (FCT)"
            : `${state.name} State`,
        secondary: `Capital: ${state.capital} · ${state.zone}`,
        state: state.name,
        source: "gazetteer",
      });
    }
  }

  // Prefix matches first so typing "Ike" surfaces Ikeja before Zangon Kataf.
  hits.sort((a, b) => {
    const aStarts = a.label.toLowerCase().startsWith(needle) ? 0 : 1;
    const bStarts = b.label.toLowerCase().startsWith(needle) ? 0 : 1;
    return aStarts - bStarts || a.label.localeCompare(b.label);
  });

  return hits.slice(0, limit);
}

async function callPlaces<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke<T>("places", { body });
    if (error) {
      console.error("[places]", error.message);
      return null;
    }
    return data ?? null;
  } catch (err) {
    console.error("[places]", err);
    return null;
  }
}

export async function searchPlaces(
  query: string,
  sessionToken?: string,
): Promise<PlaceSuggestion[]> {
  const fallback = gazetteerSearch(query);

  const result = await callPlaces<{
    configured?: boolean;
    suggestions?: Array<{ id: string; label: string; secondary?: string }>;
  }>({ action: "autocomplete", query, sessionToken });

  const google = (result?.suggestions ?? []).map((s) => {
    const inferred = inferStateAndLga(`${s.label} ${s.secondary ?? ""}`);
    return { ...s, ...inferred, source: "google" as const };
  });

  if (google.length === 0) return fallback;

  // Blend in gazetteer hits Google does not index (many LGA names).
  const seen = new Set(google.map((g) => g.label.toLowerCase()));
  const extra = fallback.filter((f) => !seen.has(f.label.toLowerCase())).slice(0, 3);
  return [...google, ...extra];
}

export async function resolvePlace(placeId: string): Promise<ResolvedPlace> {
  // Gazetteer entries carry their own answer in the id — no round trip.
  if (placeId.startsWith("gz:")) {
    const [, stateName, lga] = placeId.split(":");
    return {
      address: lga ? `${lga} LGA, ${stateName}, Nigeria` : `${stateName}, Nigeria`,
      state: stateName || undefined,
      lga: lga || undefined,
    };
  }

  const result = await callPlaces<{
    place?: {
      address?: string;
      latitude?: number;
      longitude?: number;
      admin1?: string;
      admin2?: string;
    };
  }>({ action: "details", placeId });

  const place = result?.place;
  if (!place?.address) return { address: "" };

  const inferred = inferStateAndLga(`${place.admin1 ?? ""} ${place.admin2 ?? ""} ${place.address}`);
  return {
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    state: inferred.state,
    lga: inferred.lga ?? place.admin2,
  };
}

/** Best-effort reverse geocode for the "use my location" affordance. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<ResolvedPlace> {
  const coarse = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;

  const result = await callPlaces<{
    place?: { address?: string; admin1?: string; admin2?: string };
  }>({ action: "reverse", latitude, longitude });

  const place = result?.place;
  if (!place?.address) return { address: coarse, latitude, longitude };

  const inferred = inferStateAndLga(`${place.admin1 ?? ""} ${place.admin2 ?? ""} ${place.address}`);
  return {
    address: place.address,
    latitude,
    longitude,
    state: inferred.state,
    lga: inferred.lga ?? place.admin2,
  };
}
