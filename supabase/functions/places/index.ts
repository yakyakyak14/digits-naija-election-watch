/**
 * DIGITs — Places lookup proxy (Supabase Edge Function).
 *
 * Keeps GOOGLE_PLACES_API server-side. The browser never sees the key; it calls
 * this function, which forwards to Google and normalises the response.
 *
 * Falls back to an empty result set rather than an error when the key is absent
 * or the upstream call fails — the client then uses its built-in Nigerian
 * gazetteer, so location fields keep working regardless.
 *
 * Deploy: POST /v1/projects/{ref}/functions/deploy?slug=places
 * Secrets: GOOGLE_PLACES_API
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NIGERIA_RECTANGLE = {
  low: { latitude: 4.0, longitude: 2.6 },
  high: { latitude: 13.9, longitude: 14.7 },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

interface Suggestion {
  id: string;
  label: string;
  secondary?: string;
  source: "google";
}

async function autocomplete(key: string, query: string, sessionToken?: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ["ng"],
      locationRestriction: { rectangle: NIGERIA_RECTANGLE },
      sessionToken,
    }),
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) {
    console.error("places.autocomplete", res.status, await res.text().catch(() => ""));
    return [] as Suggestion[];
  }

  const payload = await res.json();
  return (payload.suggestions ?? [])
    .map((s: Record<string, any>) => s.placePrediction)
    .filter((p: Record<string, any> | undefined) => p?.placeId)
    .map((p: Record<string, any>) => ({
      id: p.placeId as string,
      label: (p.structuredFormat?.mainText?.text ?? "") as string,
      secondary: (p.structuredFormat?.secondaryText?.text ?? "") as string,
      source: "google" as const,
    }))
    .filter((s: Suggestion) => s.label.length > 0);
}

async function details(key: string, placeId: string) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "formattedAddress,location,addressComponents,displayName",
    },
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) {
    console.error("places.details", res.status);
    return null;
  }

  const place = await res.json();
  const components: Array<Record<string, any>> = place.addressComponents ?? [];
  const pick = (type: string) =>
    components.find((c) => (c.types ?? []).includes(type))?.longText as string | undefined;

  const address = [place.displayName?.text, place.formattedAddress]
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .join(", ");

  return {
    address,
    latitude: place.location?.latitude as number | undefined,
    longitude: place.location?.longitude as number | undefined,
    admin1: pick("administrative_area_level_1"),
    admin2: pick("administrative_area_level_2"),
  };
}

async function reverse(key: string, latitude: number, longitude: number) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${latitude},${longitude}`);
  url.searchParams.set("region", "ng");
  url.searchParams.set("key", key);

  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) return null;

  const payload = await res.json();
  const first = payload.results?.[0];
  if (!first) return null;

  const components: Array<Record<string, any>> = first.address_components ?? [];
  const pick = (type: string) =>
    components.find((c) => (c.types ?? []).includes(type))?.long_name as string | undefined;

  return {
    address: first.formatted_address as string,
    admin1: pick("administrative_area_level_1"),
    admin2: pick("administrative_area_level_2"),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const key = Deno.env.get("GOOGLE_PLACES_API");
  if (!key) return json({ configured: false, suggestions: [] });

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  try {
    switch (body.action) {
      case "autocomplete": {
        const query = String(body.query ?? "").trim();
        if (query.length < 2) return json({ configured: true, suggestions: [] });
        return json({
          configured: true,
          suggestions: await autocomplete(key, query.slice(0, 160), body.sessionToken),
        });
      }

      case "details": {
        const placeId = String(body.placeId ?? "");
        if (!placeId) return json({ error: "placeId required." }, 400);
        return json({ configured: true, place: await details(key, placeId) });
      }

      case "reverse": {
        const latitude = Number(body.latitude);
        const longitude = Number(body.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return json({ error: "latitude and longitude required." }, 400);
        }
        return json({ configured: true, place: await reverse(key, latitude, longitude) });
      }

      default:
        return json({ error: "Unknown action." }, 400);
    }
  } catch (err) {
    console.error("places error", err);
    // Never fail hard: the client has a gazetteer fallback.
    return json({ configured: true, suggestions: [], place: null });
  }
});
