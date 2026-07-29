import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Search location or polling unit...",
  className = "",
}: GooglePlacesAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{ description: string; lat: number; lng: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch location suggestions (combining Google Places API and Nigerian polling unit coordinates)
  const handleInputChange = (text: string) => {
    setQuery(text);
    onChange(text);
    if (text.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setShowDropdown(true);

    // Simulated Google Places API autocomplete for Nigerian locations & polling units
    setTimeout(() => {
      const mockLocations = [
        { description: `${text}, Ikeja LGA, Lagos State`, lat: 6.6018, lng: 3.3515 },
        { description: `${text}, Garki PU 001, Abuja Municipal (AMAC), FCT`, lat: 9.0765, lng: 7.3986 },
        { description: `${text}, Giginyu Ward, Nasarawa LGA, Kano State`, lat: 12.0022, lng: 8.592 },
        { description: `${text}, GRA Phase 2, Port Harcourt, Rivers State`, lat: 4.8156, lng: 7.0498 },
        { description: `${text}, Independence Layout, Enugu North, Enugu State`, lat: 6.4584, lng: 7.5464 },
      ];
      setSuggestions(mockLocations);
      setIsLoading(false);
    }, 300);
  };

  const handleSelect = (item: { description: string; lat: number; lng: number }) => {
    setQuery(item.description);
    onChange(item.description, item.lat, item.lng);
    setShowDropdown(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length >= 3 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs hover:bg-accent text-popover-foreground transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{item.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
