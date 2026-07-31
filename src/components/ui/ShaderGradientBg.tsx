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
  cDistance: 2.29,
  cPolarAngle: 90,
  cameraZoom: 1,
  color1: "#84ff42",
  color2: "#5cdb6f",
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
  range: "disabled",
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

/**
 * ShaderGradientBg — Full-page animated 3D WebGL gradient background.
 * Renders a fixed, full-viewport ShaderGradient canvas behind all content.
 */
export const ShaderGradientBg = memo(function ShaderGradientBg({ className }: ShaderGradientBgProps) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none select-none z-0 ${className || ""}`}
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
