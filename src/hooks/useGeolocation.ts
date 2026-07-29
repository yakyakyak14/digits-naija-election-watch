import { useCallback, useEffect, useRef, useState } from "react";

export interface GeoFix {
  latitude: number;
  longitude: number;
  accuracy: number;
  at: number;
}

export type GeoStatus = "idle" | "prompting" | "granted" | "denied" | "unavailable" | "timeout";

/**
 * Location gate for i-Witness. The browser prompt is raised only when `request()`
 * is called — i.e. when the reporter actually starts a report — never on page
 * load. Once granted we watch the position so the coordinates stamped onto the
 * evidence are current at the moment of capture, not at the moment of consent.
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [fix, setFix] = useState<GeoFix | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  const request = useCallback((): Promise<GeoFix | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return Promise.resolve(null);
    }

    setStatus("prompting");

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next: GeoFix = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            at: pos.timestamp,
          };
          setFix(next);
          setStatus("granted");

          // Keep tracking so the stamp on each clip reflects where it was taken.
          stop();
          watchIdRef.current = navigator.geolocation.watchPosition(
            (p) =>
              setFix({
                latitude: p.coords.latitude,
                longitude: p.coords.longitude,
                accuracy: p.coords.accuracy,
                at: p.timestamp,
              }),
            () => {
              /* transient watch failures keep the last good fix */
            },
            { enableHighAccuracy: true, maximumAge: 15_000 },
          );

          resolve(next);
        },
        (err) => {
          setStatus(
            err.code === err.PERMISSION_DENIED
              ? "denied"
              : err.code === err.TIMEOUT
                ? "timeout"
                : "unavailable",
          );
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
      );
    });
  }, [stop]);

  return { status, fix, request, stop, hasFix: fix !== null };
}
