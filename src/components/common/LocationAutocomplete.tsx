import { useEffect, useId, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resolvePlace, reverseGeocode, searchPlaces, type PlaceSuggestion } from "@/lib/places";

export interface ResolvedLocation {
  address: string;
  latitude?: number;
  longitude?: number;
  state?: string;
  lga?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: ResolvedLocation) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  /** Shows the "use my current location" crosshair. */
  allowCurrentLocation?: boolean;
  "aria-describedby"?: string;
}

/**
 * Map-backed location field: suggestions appear as the user types, resolved via
 * the server-side Places proxy with the offline Nigerian gazetteer as fallback.
 * Used everywhere the platform asks for a location.
 */
export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Start typing a town, LGA or polling unit…",
  className,
  id,
  disabled = false,
  allowCurrentLocation = true,
  "aria-describedby": describedBy,
}: LocationAutocompleteProps) {
  const generatedId = useId();
  const inputId = id ?? `location-${generatedId}`;
  const listboxId = `${inputId}-listbox`;

  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);
  // One session token per typing session keeps Places autocomplete billing on
  // the per-session rate rather than per-keystroke.
  const sessionToken = useRef(crypto.randomUUID?.() ?? String(Date.now()));
  const requestSeq = useRef(0);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  // Debounced lookup — 280ms is short enough to feel live, long enough to skip
  // a request per keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed === value.trim()) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const seq = ++requestSeq.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(trimmed, sessionToken.current);
        if (seq !== requestSeq.current) return; // a newer keystroke won
        setSuggestions(results);
        setActiveIndex(-1);
        setOpen(results.length > 0);
      } catch {
        if (seq === requestSeq.current) setSuggestions([]);
      } finally {
        if (seq === requestSeq.current) setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, value]);

  async function choose(suggestion: PlaceSuggestion) {
    setOpen(false);
    setResolving(true);
    const label = [suggestion.label, suggestion.secondary].filter(Boolean).join(", ");
    setQuery(label);

    try {
      const resolved = await resolvePlace(suggestion.id);
      sessionToken.current = crypto.randomUUID?.() ?? String(Date.now());
      onChange({
        address: resolved.address || label,
        latitude: resolved.latitude ?? suggestion.latitude,
        longitude: resolved.longitude ?? suggestion.longitude,
        state: resolved.state ?? suggestion.state,
        lga: resolved.lga ?? suggestion.lga,
      });
    } catch {
      onChange({ address: label, state: suggestion.state, lga: suggestion.lga });
    } finally {
      setResolving(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("This device cannot share a location.");
      return;
    }
    setResolving(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resolved = await reverseGeocode(latitude, longitude);
          setQuery(resolved.address);
          onChange({
            address: resolved.address,
            latitude,
            longitude,
            state: resolved.state,
            lga: resolved.lga,
          });
        } finally {
          setResolving(false);
        }
      },
      () => {
        setResolving(false);
        toast.error("Location permission denied. Type the location instead.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      void choose(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const busy = searching || resolving;

  return (
    <div className={cn("relative w-full", className)} ref={wrapRef}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ address: e.target.value });
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-10 w-full rounded-lg border border-input bg-background pl-9 text-sm outline-none transition-shadow",
            "placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25",
            "disabled:cursor-not-allowed disabled:opacity-60",
            allowCurrentLocation ? "pr-20" : "pr-10",
          )}
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {allowCurrentLocation && (
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={disabled || resolving}
              title="Use my current location"
              aria-label="Use my current location"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-50"
            >
              <Crosshair className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="scroll-slim absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg"
        >
          {suggestions.map((s, idx) => (
            <li
              key={s.id}
              id={`${listboxId}-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => void choose(s)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                  idx === activeIndex ? "bg-accent/25" : "hover:bg-accent/15",
                )}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-popover-foreground">
                    {s.label}
                  </span>
                  {s.secondary && (
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {s.secondary}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
