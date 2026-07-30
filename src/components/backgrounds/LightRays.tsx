import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type RaysOrigin =
  "top-center" | "top-left" | "top-right" | "left" | "right" | "bottom-center";

export interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  className?: string;
}

const ORIGIN: Record<RaysOrigin, [number, number]> = {
  "top-center": [0.5, 0.0],
  "top-left": [0.0, 0.0],
  "top-right": [1.0, 0.0],
  left: [0.0, 0.5],
  right: [1.0, 0.5],
  "bottom-center": [0.5, 1.0],
};

const VERTEX = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform vec2  uOrigin;      // ray source in 0..1 space
uniform vec2  uMouse;       // pointer in 0..1 space
uniform vec3  uColor;
uniform float uTime;
uniform float uSpeed;
uniform float uSpread;
uniform float uRayLength;
uniform float uMouseInfluence;
uniform float uNoise;
uniform float uDistortion;
uniform float uPulsating;
uniform float uFadeDistance;
uniform float uSaturation;

// Cheap value noise — enough grain to break up banding without a texture fetch.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  // Aspect-corrected coordinates so rays stay straight on wide viewports.
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / max(uResolution.y, 1.0);

  vec2 origin = uOrigin;
  // Let the pointer nudge the apparent source, without ever leaving the frame.
  origin += (uMouse - vec2(0.5)) * uMouseInfluence;

  vec2 delta = uv - origin;
  delta.x *= aspect;

  float dist = length(delta);
  float angle = atan(delta.x, delta.y);

  // Optional lateral warp of the fan.
  angle += sin(dist * 6.2831 + uTime * uSpeed * 0.6) * uDistortion * 0.35;

  float t = uTime * uSpeed;

  // Three layers of differing frequency read as light shafts rather than stripes.
  float spread = max(uSpread, 0.001);
  float freq = 18.0 / spread;
  float rays =
      0.55 * (0.5 + 0.5 * sin(angle * freq * 1.00 + t * 0.90))
    + 0.30 * (0.5 + 0.5 * sin(angle * freq * 2.30 - t * 1.20))
    + 0.15 * (0.5 + 0.5 * sin(angle * freq * 4.70 + t * 0.55));

  // Sharpen into distinct shafts.
  rays = pow(clamp(rays, 0.0, 1.0), 3.0);

  // Length falloff along the shaft, plus an overall fade from the source.
  float reach = max(uRayLength, 0.001);
  float lengthFade = exp(-dist / reach);
  float sourceFade = 1.0 - smoothstep(0.0, max(uFadeDistance, 0.001), dist);
  float intensity = rays * lengthFade * mix(0.35, 1.0, sourceFade);

  // Brighten right at the source so the origin reads as the light.
  intensity += exp(-dist * 14.0) * 0.55;

  if (uPulsating > 0.5) {
    intensity *= 0.75 + 0.25 * sin(uTime * uSpeed * 2.0);
  }

  if (uNoise > 0.0) {
    intensity *= 1.0 - uNoise * (1.0 - valueNoise(uv * uResolution * 0.02 + t));
  }

  vec3 color = uColor;
  // Desaturate toward luminance when saturation < 1.
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, clamp(uSaturation, 0.0, 2.0));

  // Premultiplied so the canvas composites additively over the page.
  float alpha = clamp(intensity, 0.0, 1.0);
  fragColor = vec4(color * alpha, alpha);
}`;

function parseColor(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Volumetric light rays rendered with a single full-screen fragment shader.
 *
 * Written against raw WebGL2 rather than pulling in a WebGL helper library, and
 * deliberately frugal, because this sits behind an input the user types into:
 *
 *  - the render loop stops when the tab is hidden or the element scrolls
 *    off-screen (IntersectionObserver), so it never burns cycles unseen
 *  - device pixel ratio is capped at 1.5 — a full-viewport shader at DPR 3 is
 *    ~4x the fragments for no visible gain
 *  - the pointer position is read from a cached rect, updated on resize/scroll
 *    only, so pointer movement never forces a layout
 *  - `prefers-reduced-motion` renders one static frame and stops
 *  - if WebGL2 is unavailable the component renders nothing and the CSS gradient
 *    behind it carries the design
 */
export function LightRays({
  raysOrigin = "top-center",
  raysColor = "#ffffff",
  raysSpeed = 1,
  lightSpread = 0.5,
  rayLength = 3,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0,
  distortion = 0,
  pulsating = false,
  fadeDistance = 1,
  saturation = 1,
  className,
}: LightRaysProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Props are funnelled through a ref so changing them never tears down the GL
  // context or restarts the loop.
  const settings = useRef({
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
    pulsating,
    fadeDistance,
    saturation,
  });
  settings.current = {
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
    pulsating,
    fadeDistance,
    saturation,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const compile = (type: number, source: string, label: string) => {
      const shader = gl.createShader(type);
      if (!shader) {
        console.error(`[LightRays] could not create ${label} shader`);
        return null;
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // Name the stage and quote the reported line: an empty info log is common
        // on some drivers, and without the stage there is nothing to act on.
        const log = gl.getShaderInfoLog(shader) || "(driver returned no info log)";
        const lineMatch = /:(\d+):/.exec(log);
        const offending = lineMatch
          ? source.split("\n")[Number(lineMatch[1]) - 1]?.trim()
          : undefined;
        console.error(
          `[LightRays] ${label} shader failed to compile: ${log}${offending ? `\n  -> ${offending}` : ""}`,
        );
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX, "vertex");
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT, "fragment");
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) {
      console.error("[LightRays] could not create program");
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        `[LightRays] program failed to link: ${gl.getProgramInfoLog(program) || "(no info log)"}`,
      );
      return;
    }
    gl.useProgram(program);

    // Full-screen triangle — two fewer vertices than a quad, same coverage.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      resolution: gl.getUniformLocation(program, "uResolution"),
      origin: gl.getUniformLocation(program, "uOrigin"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      color: gl.getUniformLocation(program, "uColor"),
      time: gl.getUniformLocation(program, "uTime"),
      speed: gl.getUniformLocation(program, "uSpeed"),
      spread: gl.getUniformLocation(program, "uSpread"),
      rayLength: gl.getUniformLocation(program, "uRayLength"),
      mouseInfluence: gl.getUniformLocation(program, "uMouseInfluence"),
      noise: gl.getUniformLocation(program, "uNoise"),
      distortion: gl.getUniformLocation(program, "uDistortion"),
      pulsating: gl.getUniformLocation(program, "uPulsating"),
      fadeDistance: gl.getUniformLocation(program, "uFadeDistance"),
      saturation: gl.getUniformLocation(program, "uSaturation"),
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Cached geometry: pointer handling must never call getBoundingClientRect.
    let rect = canvas.getBoundingClientRect();
    const refreshRect = () => {
      rect = canvas.getBoundingClientRect();
    };

    // A soft light effect does not need 1:1 pixels; rendering at 0.75x and
    // letting CSS upscale halves the fragment count with no visible difference.
    const RESOLUTION_SCALE = 0.75;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * RESOLUTION_SCALE;
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      refreshRect();
    };

    const pointer = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };
    const onPointerMove = (event: PointerEvent) => {
      if (!settings.current.followMouse) return;
      target.x = (event.clientX - rect.left) / Math.max(rect.width, 1);
      target.y = (event.clientY - rect.top) / Math.max(rect.height, 1);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // If the GPU is emulated in software, animating a full-screen shader is a
    // guaranteed input-latency problem. Detect it up front and render statically
    // rather than waiting for the watchdog to notice.
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const rendererName = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? "")
      : "";
    const softwareRenderer = /swiftshader|software|basic render|llvmpipe/i.test(rendererName);

    let frame = 0;
    let running = false;
    let visible = true;
    const start = performance.now();

    const draw = (now: number) => {
      const s = settings.current;
      const [ox, oy] = ORIGIN[s.raysOrigin] ?? ORIGIN["top-center"];
      const [r, g, b] = parseColor(s.raysColor);

      // Ease the pointer so the fan drifts instead of snapping.
      pointer.x += (target.x - pointer.x) * 0.06;
      pointer.y += (target.y - pointer.y) * 0.06;

      gl.uniform2f(u.resolution, canvas.width, canvas.height);
      gl.uniform2f(u.origin, ox, oy);
      gl.uniform2f(u.mouse, pointer.x, pointer.y);
      gl.uniform3f(u.color, r, g, b);
      gl.uniform1f(u.time, (now - start) / 1000);
      gl.uniform1f(u.speed, s.raysSpeed);
      gl.uniform1f(u.spread, s.lightSpread);
      gl.uniform1f(u.rayLength, s.rayLength);
      gl.uniform1f(u.mouseInfluence, s.followMouse ? s.mouseInfluence : 0);
      gl.uniform1f(u.noise, s.noiseAmount);
      gl.uniform1f(u.distortion, s.distortion);
      gl.uniform1f(u.pulsating, s.pulsating ? 1 : 0);
      gl.uniform1f(u.fadeDistance, s.fadeDistance);
      gl.uniform1f(u.saturation, s.saturation);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /*
     * Frame-rate watchdog.
     *
     * A full-viewport fragment shader is cheap on a GPU and expensive without
     * one. Measured under software rasterisation, animating this pushed median
     * keystroke latency from 21ms to 563ms — unacceptable on a page whose job is
     * typing credentials, and exactly what a low-end device does.
     *
     * So: sample the first stretch of frames, and if we cannot hold ~45fps, stop
     * animating and leave the last rendered frame on screen. The rays still look
     * like rays; they simply stop moving on hardware that cannot afford it.
     */
    let sampled = 0;
    let elapsedSum = 0;
    let lastFrameAt = 0;
    let degraded = false;

    const WATCHDOG_FRAMES = 30;
    const MAX_MEAN_FRAME_MS = 22; // ~45fps

    const loop = (now: number) => {
      draw(now);

      if (!degraded) {
        if (lastFrameAt > 0) {
          elapsedSum += now - lastFrameAt;
          sampled++;

          if (sampled >= WATCHDOG_FRAMES) {
            const mean = elapsedSum / sampled;
            if (mean > MAX_MEAN_FRAME_MS) {
              degraded = true;
              running = false;
              cancelAnimationFrame(frame);
              return; // static frame from here on
            }
            // Healthy — stop measuring.
            sampled = 0;
            elapsedSum = 0;
            lastFrameAt = 0;
            degraded = false;
            frame = requestAnimationFrame(healthyLoop);
            return;
          }
        }
        lastFrameAt = now;
      }

      frame = requestAnimationFrame(loop);
    };

    // Post-watchdog loop with no measurement overhead.
    const healthyLoop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(healthyLoop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const play = () => {
      if (running || !visible || document.hidden) return;
      // One static frame, then nothing — for reduced motion, software GPUs, and
      // hardware the watchdog has already judged too slow.
      if (reducedMotion.matches || softwareRenderer || degraded) {
        resize();
        draw(performance.now());
        return;
      }
      running = true;
      frame = requestAnimationFrame(loop);
    };

    resize();

    // Only animate while actually on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) play();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : play());
    const onResize = () => {
      resize();
      if (reducedMotion.matches) draw(performance.now());
    };
    const onMotionChange = () => {
      stop();
      play();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", refreshRect, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reducedMotion.addEventListener("change", onMotionChange);

    play();

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", refreshRect);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onMotionChange);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Deliberately NOT calling WEBGL_lose_context.loseContext(): getContext()
      // hands back the same context object for a given canvas, so losing it here
      // poisons the canvas for the next mount. Under StrictMode's double-invoke
      // that meant every shader compile on the second mount failed with an empty
      // info log and the rays never rendered in development. Deleting the
      // resources is enough; the context goes with the canvas.
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none block h-full w-full", className)}
    />
  );
}
