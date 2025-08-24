/**
 * Path parsing and drawing functions for SVG paths
 */

import { transformCoord } from "../core/utils.js";
import { applyTransformsToPath } from "../core/transform-utils.js";

// Elliptical arc calculation functions
export function ellipticalArcToBezier(
  x1,
  y1,
  rx,
  ry,
  xAxisRotation,
  largeArcFlag,
  sweepFlag,
  x2,
  y2
) {
  const phi = (xAxisRotation * Math.PI) / 180;

  // Step 1: Compute (x1′, y1′)
  const dx = (x1 - x2) / 2,
    dy = (y1 - y2) / 2;
  const x1Prime = Math.cos(phi) * dx + Math.sin(phi) * dy;
  const y1Prime = -Math.sin(phi) * dx + Math.cos(phi) * dy;

  // Step 2: Compute (cx′, cy′) with radius correction
  let rxSq = rx * rx,
    rySq = ry * ry;
  const x1PrimeSq = x1Prime * x1Prime,
    y1PrimeSq = y1Prime * y1Prime;

  const radiiCheck = x1PrimeSq / rxSq + y1PrimeSq / rySq;
  if (radiiCheck > 1) {
    rx = Math.sqrt(radiiCheck) * rx;
    ry = Math.sqrt(radiiCheck) * ry;
    rxSq = rx * rx;
    rySq = ry * ry;
  }

  const sign = largeArcFlag === sweepFlag ? -1 : 1;
  const pq =
    (rxSq * rySq - rxSq * y1PrimeSq - rySq * x1PrimeSq) /
    (rxSq * y1PrimeSq + rySq * x1PrimeSq);
  const coef = sign * Math.sqrt(Math.max(0, pq)); // Handle precision issues
  const cxPrime = (coef * (rx * y1Prime)) / ry;
  const cyPrime = (coef * (-ry * x1Prime)) / rx;

  // Step 3: Compute center (cx, cy)
  const cx = Math.cos(phi) * cxPrime - Math.sin(phi) * cyPrime + (x1 + x2) / 2;
  const cy = Math.sin(phi) * cxPrime + Math.cos(phi) * cyPrime + (y1 + y2) / 2;

  // Step 4: Compute angles with better precision handling
  const startAngle = Math.atan2(
    (y1Prime - cyPrime) / ry,
    (x1Prime - cxPrime) / rx
  );
  let deltaAngle =
    Math.atan2((-y1Prime - cyPrime) / ry, (-x1Prime - cxPrime) / rx) -
    startAngle;

  // Normalize delta angle based on flags
  if (!sweepFlag && deltaAngle > 0) deltaAngle -= 2 * Math.PI;
  else if (sweepFlag && deltaAngle < 0) deltaAngle += 2 * Math.PI;

  // Step 5: Approximate with cubic Bezier curves
  const segments = Math.ceil(Math.abs(deltaAngle) / (Math.PI / 2));
  const curves = [];

  for (let i = 0; i < segments; i++) {
    const start = startAngle + (deltaAngle * i) / segments;
    const end = startAngle + (deltaAngle * (i + 1)) / segments;
    curves.push(arcSegmentToBezier(cx, cy, rx, ry, phi, start, end));
  }

  return curves;
}

export function arcSegmentToBezier(cx, cy, rx, ry, phi, startAngle, endAngle) {
  const angleDiff = endAngle - startAngle;

  // Use Maisonobe's approximation for better accuracy
  const alpha =
    (Math.sin(angleDiff) *
      (Math.sqrt(4 + 3 * Math.tan(angleDiff / 2) ** 2) - 1)) /
    3;

  const cosStart = Math.cos(startAngle),
    sinStart = Math.sin(startAngle);
  const cosEnd = Math.cos(endAngle),
    sinEnd = Math.sin(endAngle);

  // Start and end points
  const x1 = cx + rx * (cosStart * Math.cos(phi) - sinStart * Math.sin(phi));
  const y1 = cy + rx * (cosStart * Math.sin(phi) + sinStart * Math.cos(phi));
  const x4 = cx + rx * (cosEnd * Math.cos(phi) - sinEnd * Math.sin(phi));
  const y4 = cy + rx * (cosEnd * Math.sin(phi) + sinEnd * Math.cos(phi));

  // Control points using parametric derivatives
  const q1x =
    x1 + alpha * rx * (-sinStart * Math.cos(phi) - cosStart * Math.sin(phi));
  const q1y =
    y1 + alpha * rx * (-sinStart * Math.sin(phi) + cosStart * Math.cos(phi));
  const q2x =
    x4 - alpha * rx * (-sinEnd * Math.cos(phi) - cosEnd * Math.sin(phi));
  const q2y =
    y4 - alpha * rx * (-sinEnd * Math.sin(phi) + cosEnd * Math.cos(phi));

  return { x1, y1, x2: q1x, y2: q1y, x3: q2x, y3: q2y, x4, y4 };
}

// Helper function to draw Bezier curves
export function drawBezierCurve(p, bezier, viewBox, scaleX, scaleY) {
  const p2 = transformCoord(bezier.x2, bezier.y2, viewBox, scaleX, scaleY);
  const p3 = transformCoord(bezier.x3, bezier.y3, viewBox, scaleX, scaleY);
  const p4 = transformCoord(bezier.x4, bezier.y4, viewBox, scaleX, scaleY);

  if (p.bezierOrder) {
    p.bezierOrder(3);
    p.bezierVertex(p2.x, p2.y);
    p.bezierVertex(p3.x, p3.y);
    p.bezierVertex(p4.x, p4.y);
  } else {
    p.bezierVertex(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
  }
}

/**
 * Convert a rectangle to path data
 * @param {Object} rect - Rectangle object with x, y, width, height
 * @returns {Array} Array of path commands
 */
function rectToPathCommands(rect) {
  const { x, y, width, height } = rect;
  return [
    { type: "M", x, y },
    { type: "L", x: x + width, y },
    { type: "L", x: x + width, y: y + height },
    { type: "L", x, y: y + height },
    { type: "Z" },
  ];
}

/**
 * Convert a circle to path data
 * @param {Object} circle - Circle object with cx, cy, r
 * @returns {Array} Array of path commands
 */
function circleToPathCommands(circle) {
  const { cx, cy, r } = circle;
  // Approximate circle with 4 cubic bezier curves
  const k = 0.5522848; // Magic number for circle approximation
  const kr = k * r;

  return [
    { type: "M", x: cx + r, y: cy },
    {
      type: "C",
      x1: cx + r,
      y1: cy - kr,
      x2: cx + kr,
      y2: cy - r,
      x: cx,
      y: cy - r,
    },
    {
      type: "C",
      x1: cx - kr,
      y1: cy - r,
      x2: cx - r,
      y2: cy - kr,
      x: cx - r,
      y: cy,
    },
    {
      type: "C",
      x1: cx - r,
      y1: cy + kr,
      x2: cx - kr,
      y2: cy + r,
      x: cx,
      y: cy + r,
    },
    {
      type: "C",
      x1: cx + kr,
      y1: cy + r,
      x2: cx + r,
      y2: cy + kr,
      x: cx + r,
      y: cy,
    },
    { type: "Z" },
  ];
}

/**
 * Convert an ellipse to path data
 * @param {Object} ellipse - Ellipse object with cx, cy, rx, ry
 * @returns {Array} Array of path commands
 */
function ellipseToPathCommands(ellipse) {
  const { cx, cy, rx, ry } = ellipse;
  // Approximate ellipse with 4 cubic bezier curves
  const k = 0.5522848; // Magic number for circle approximation
  const kx = k * rx;
  const ky = k * ry;

  return [
    { type: "M", x: cx + rx, y: cy },
    {
      type: "C",
      x1: cx + rx,
      y1: cy - ky,
      x2: cx + kx,
      y2: cy - ry,
      x: cx,
      y: cy - ry,
    },
    {
      type: "C",
      x1: cx - kx,
      y1: cy - ry,
      x2: cx - rx,
      y2: cy - ky,
      x: cx - rx,
      y: cy,
    },
    {
      type: "C",
      x1: cx - rx,
      y1: cy + ky,
      x2: cx - kx,
      y2: cy + ry,
      x: cx,
      y: cy + ry,
    },
    {
      type: "C",
      x1: cx + kx,
      y1: cy + ry,
      x2: cx + rx,
      y2: cy + ky,
      x: cx + rx,
      y: cy,
    },
    { type: "Z" },
  ];
}

/**
 * Convert a line to path data
 * @param {Object} line - Line object with x1, y1, x2, y2
 * @returns {Array} Array of path commands
 */
function lineToPathCommands(line) {
  const { x1, y1, x2, y2 } = line;
  return [
    { type: "M", x: x1, y: y1 },
    { type: "L", x: x2, y: y2 },
  ];
}

/**
 * Convert polyline/polygon points to path data
 * @param {Array} points - Array of point objects with x, y
 * @param {boolean} closePath - Whether to close the path
 * @returns {Array} Array of path commands
 */
function polyToPathCommands(points, closePath = false) {
  if (!points || points.length === 0) return [];

  const commands = [];

  // Start with first point
  if (points.length > 0) {
    commands.push({ type: "M", x: points[0].x, y: points[0].y });
  }

  // Add line commands for subsequent points
  for (let i = 1; i < points.length; i++) {
    commands.push({ type: "L", x: points[i].x, y: points[i].y });
  }

  // Close path if requested
  if (closePath && points.length > 2) {
    commands.push({ type: "Z" });
  }

  return commands;
}

/**
 * Flatten transforms by applying them to SVG shapes and converting to path data
 * @param {Object} element - SVG element object with type, commands, and styles
 * @returns {Array} Flattened path commands with transforms applied
 */
export function flattenTransforms(element) {
  if (!element) return [];

  let pathCommands = [];

  switch (element.type) {
    case "path":
      pathCommands = element.commands || [];
      break;

    case "rect":
      pathCommands = rectToPathCommands(element.commands[0]);
      break;

    case "circle":
      pathCommands = circleToPathCommands(element.commands[0]);
      break;

    case "ellipse":
      pathCommands = ellipseToPathCommands(element.commands[0]);
      break;

    case "line":
      pathCommands = lineToPathCommands(element.commands[0]);
      break;

    case "polyline":
      pathCommands = polyToPathCommands(element.commands, false);
      break;

    case "polygon":
      pathCommands = polyToPathCommands(element.commands, true);
      break;

    case "text":
      // Text is complex to convert to path - for now, return empty array
      console.warn(
        "Text elements cannot be converted to paths in flattenTransforms"
      );
      return [];

    case "group":
      // For groups, recursively flatten all children and combine
      if (element.children && element.children.length > 0) {
        const childPaths = element.children.map((child) =>
          flattenTransforms(child)
        );
        return childPaths.flat();
      }
      return [];

    default:
      console.warn(`Unknown element type: ${element.type}`);
      return [];
  }

  if (element.styles && element.styles.transform && pathCommands.length > 0) {
    pathCommands = applyTransformsToPath(
      pathCommands,
      element.styles.transform
    );
  }

  return {
    commands: pathCommands,
    styles: (() => {
      if (!element.styles) return {};
      const { transform, ...rest } = element.styles;
      return rest;
    })(),
  };
}
