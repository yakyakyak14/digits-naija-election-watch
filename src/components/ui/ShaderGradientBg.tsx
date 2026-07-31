import React, { memo } from "react";
import { ShaderGradientCanvas, ShaderGradient } from "shadergradient";

interface ShaderGradientBgProps {
  className?: string;
}

const shaderProps: any = {
  animate: "on",
  axesHelper: "off",
  brightness: 1.2,
  cAzimuthAngle: 180,
  cDistance: 4.3,
  cPolarAngle: 90,
  cameraZoom: 1,
  color1: "#2bff4f",
  color2: "#abdbb5",
  color3: "#4de1d2",
  destination: "onCanvas",
  embedMode: "off",
  envPreset: "city",
  format: "gif",
  fov: 50,
  frameRate: 10,
  gizmoHelper: "hide",
  grain: "on",
  lightType: "3d",
  pixelDensity: 1,
  positionX: -1.4,
  positionY: 0,
  positionZ: 0,
  range: "enabled",
  rangeEnd: 40,
  rangeStart: 0,
  reflection: 0.1,
  rotationX: 0,
  rotationY: 10,
  rotationZ: 50,
  shader: "defaults",
  type: "plane",
  uAmplitude: 1,
  uDensity: 2.7,
  uFrequency: 5.5,
  uSpeed: 0.2,
  uStrength: 4.4,
  uTime: 0,
  wireframe: false,
};

export const ShaderGradientBg = memo(function ShaderGradientBg({ className }: ShaderGradientBgProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none overflow-hidden ${className || ""}`}
    >
      <ShaderGradientCanvas
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <ShaderGradient {...shaderProps} />
      </ShaderGradientCanvas>
    </div>
  );
});
