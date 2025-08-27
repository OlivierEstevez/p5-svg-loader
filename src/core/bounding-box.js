import { ellipticalArcToBezier, flattenTransforms } from "../drawing/path";
import {
  buildTransformationMatrix,
  applyMatrixToPoint,
} from "./transform-utils.js";

export function calculateBoundingBox(node, viewBox, scaleX, scaleY) {
  switch (node.type || node.tagName) {
    case "group":
      return calculateGroupBoundingBox(node, viewBox, scaleX, scaleY);
    case "path":
      return calculatePathBoundingBox(
        node,
        viewBox,
        scaleX,
        scaleY,
        node.styles?.transform
      );
    case "rect":
      return calculateRectBoundingBox(
        node.commands[0],
        viewBox,
        scaleX,
        scaleY,
        node.styles?.transform
      );
    case "circle":
      return calculateCircleBoundingBox(
        node.commands[0],
        viewBox,
        scaleX,
        scaleY,
        node.styles?.transform
      );
    case "ellipse":
      return calculateEllipseBoundingBox(
        node.commands[0],
        viewBox,
        scaleX,
        scaleY,
        node.styles?.transform
      );
    case "line":
      return calculateLineBoundingBox(
        node.commands,
        viewBox,
        scaleX,
        scaleY,
        node.styles?.transform
      );
    case "polyline":
    case "polygon":
      return calculatePolyBoundingBox(
        node.commands,
        viewBox,
        scaleX,
        scaleY,
        node.styles?.transform
      );
    default:
      return null;
  }
}

export function calculatePathBoundingBox(
  node,
  viewBox,
  scaleX,
  scaleY,
  transforms
) {
  let d = node.commands;
  if (!d) return null;

  let useFlattenedTransforms = false;
  if (transforms && transforms.length > 0) {
    d = flattenTransforms(node).commands;
    useFlattenedTransforms = true;
  }

  const bbox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };
  const commands = d;
  let currentX = 0,
    currentY = 0;
  let startX = 0,
    startY = 0;
  let lastControlX = 0,
    lastControlY = 0;

  for (const cmd of commands) {
    switch (cmd.type) {
      case "M":
        currentX = cmd.x;
        currentY = cmd.y;
        startX = currentX;
        startY = currentY;
        addPoint(bbox, currentX, currentY);
        break;
      case "m":
        currentX += cmd.x;
        currentY += cmd.y;
        startX = currentX;
        startY = currentY;
        addPoint(bbox, currentX, currentY);
        break;
      case "L":
        currentX = cmd.x;
        currentY = cmd.y;
        addPoint(bbox, currentX, currentY);
        break;
      case "l":
        currentX += cmd.x;
        currentY += cmd.y;
        addPoint(bbox, currentX, currentY);
        break;
      case "H":
        currentX = cmd.x;
        addPoint(bbox, currentX, currentY);
        break;
      case "h":
        currentX += cmd.x;
        addPoint(bbox, currentX, currentY);
        break;
      case "V":
        currentY = cmd.y;
        addPoint(bbox, currentX, currentY);
        break;
      case "v":
        currentY += cmd.y;
        addPoint(bbox, currentX, currentY);
        break;
      case "C":
        addCubicBezierBounds(
          bbox,
          currentX,
          currentY,
          cmd.x1,
          cmd.y1,
          cmd.x2,
          cmd.y2,
          cmd.x,
          cmd.y
        );
        lastControlX = cmd.x2;
        lastControlY = cmd.y2;
        currentX = cmd.x;
        currentY = cmd.y;
        break;
      case "c":
        const c1x = currentX + cmd.x1;
        const c1y = currentY + cmd.y1;
        const c2x = currentX + cmd.x2;
        const c2y = currentY + cmd.y2;
        const endX = currentX + cmd.x;
        const endY = currentY + cmd.y;
        addCubicBezierBounds(
          bbox,
          currentX,
          currentY,
          c1x,
          c1y,
          c2x,
          c2y,
          endX,
          endY
        );
        lastControlX = c2x;
        lastControlY = c2y;
        currentX = endX;
        currentY = endY;
        break;
      case "S":
        const sx1 = lastControlX ? 2 * currentX - lastControlX : currentX;
        const sy1 = lastControlY ? 2 * currentY - lastControlY : currentY;
        addCubicBezierBounds(
          bbox,
          currentX,
          currentY,
          sx1,
          sy1,
          cmd.x2,
          cmd.y2,
          cmd.x,
          cmd.y
        );
        lastControlX = cmd.x2;
        lastControlY = cmd.y2;
        currentX = cmd.x;
        currentY = cmd.y;
        break;
      case "s":
        const sx1Rel = lastControlX ? 2 * currentX - lastControlX : currentX;
        const sy1Rel = lastControlY ? 2 * currentY - lastControlY : currentY;
        const sc2x = currentX + cmd.x2;
        const sc2y = currentY + cmd.y2;
        const sendX = currentX + cmd.x;
        const sendY = currentY + cmd.y;
        addCubicBezierBounds(
          bbox,
          currentX,
          currentY,
          sx1Rel,
          sy1Rel,
          sc2x,
          sc2y,
          sendX,
          sendY
        );
        lastControlX = sc2x;
        lastControlY = sc2y;
        currentX = sendX;
        currentY = sendY;
        break;
      case "Q":
        addQuadraticBezierBounds(
          bbox,
          currentX,
          currentY,
          cmd.x1,
          cmd.y1,
          cmd.x,
          cmd.y
        );
        lastControlX = cmd.x1;
        lastControlY = cmd.y1;
        currentX = cmd.x;
        currentY = cmd.y;
        break;
      case "q":
        const qc1x = currentX + cmd.x1;
        const qc1y = currentY + cmd.y1;
        const qendX = currentX + cmd.x;
        const qendY = currentY + cmd.y;
        addQuadraticBezierBounds(
          bbox,
          currentX,
          currentY,
          qc1x,
          qc1y,
          qendX,
          qendY
        );
        lastControlX = qc1x;
        lastControlY = qc1y;
        currentX = qendX;
        currentY = qendY;
        break;
      case "T":
        const tx1 = lastControlX ? 2 * currentX - lastControlX : currentX;
        const ty1 = lastControlY ? 2 * currentY - lastControlY : currentY;
        addQuadraticBezierBounds(
          bbox,
          currentX,
          currentY,
          tx1,
          ty1,
          cmd.x,
          cmd.y
        );
        lastControlX = tx1;
        lastControlY = ty1;
        currentX = cmd.x;
        currentY = cmd.y;
        break;
      case "t":
        const tx1Rel = lastControlX ? 2 * currentX - lastControlX : currentX;
        const ty1Rel = lastControlY ? 2 * currentY - lastControlY : currentY;
        const tendX = currentX + cmd.x;
        const tendY = currentY + cmd.y;
        addQuadraticBezierBounds(
          bbox,
          currentX,
          currentY,
          tx1Rel,
          ty1Rel,
          tendX,
          tendY
        );
        lastControlX = tx1Rel;
        lastControlY = ty1Rel;
        currentX = tendX;
        currentY = tendY;
        break;
      case "A":
        addArcBounds(
          bbox,
          currentX,
          currentY,
          cmd.rx,
          cmd.ry,
          cmd.xAxisRotation,
          cmd.largeArcFlag,
          cmd.sweepFlag,
          cmd.x,
          cmd.y
        );
        currentX = cmd.x;
        currentY = cmd.y;
        break;
      case "a":
        const aendX = currentX + cmd.x;
        const aendY = currentY + cmd.y;
        addArcBounds(
          bbox,
          currentX,
          currentY,
          cmd.rx,
          cmd.ry,
          cmd.xAxisRotation,
          cmd.largeArcFlag,
          cmd.sweepFlag,
          aendX,
          aendY
        );
        currentX = aendX;
        currentY = aendY;
        break;
      case "Z":
      case "z":
        if (currentX !== startX || currentY !== startY) {
          addPoint(bbox, startX, startY);
        }
        currentX = startX;
        currentY = startY;
        break;
    }
  }

  if (bbox.minX === Infinity) return null;

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculateRectBoundingBox(
  commands,
  viewBox,
  scaleX,
  scaleY,
  transforms
) {
  const x = parseFloat(commands.x) || 0;
  const y = parseFloat(commands.y) || 0;
  const width = parseFloat(commands.width) || 0;
  const height = parseFloat(commands.height) || 0;

  // TL, TR, BR, BL
  const localCorners = [
    { x: x, y: y },
    { x: x + width, y: y },
    { x: x + width, y: y + height },
    { x: x, y: y + height },
  ];

  if (transforms && transforms.length > 0) {
    return calculateTransformedBoundingBox(
      localCorners,
      transforms,
      viewBox,
      scaleX,
      scaleY
    );
  }

  const bbox = { minX: x, minY: y, maxX: x + width, maxY: y + height };

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculateCircleBoundingBox(
  commands,
  viewBox,
  scaleX,
  scaleY,
  transforms
) {
  if (transforms && transforms.length > 0) {
    return calculateTransformedCircleBoundingBox(
      commands,
      transforms,
      viewBox,
      scaleX,
      scaleY
    );
  }

  const cx = parseFloat(commands.cx) || 0;
  const cy = parseFloat(commands.cy) || 0;
  const r = parseFloat(commands.r) || 0;

  const bbox = { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r };

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculateEllipseBoundingBox(
  commands,
  viewBox,
  scaleX,
  scaleY,
  transforms
) {
  if (transforms && transforms.length > 0) {
    return calculateTransformedEllipseBoundingBox(
      commands,
      transforms,
      viewBox,
      scaleX,
      scaleY
    );
  }

  const cx = parseFloat(commands.cx) || 0;
  const cy = parseFloat(commands.cy) || 0;
  const rx = parseFloat(commands.rx) || 0;
  const ry = parseFloat(commands.ry) || 0;

  const bbox = {
    minX: cx - rx,
    minY: cy - ry,
    maxX: cx + rx,
    maxY: cy + ry,
  };

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculateLineBoundingBox(
  commands,
  viewBox,
  scaleX,
  scaleY,
  transforms
) {
  commands = commands[0];

  if (transforms && transforms.length > 0) {
    return calculateTransformedLineBoundingBox(
      commands,
      transforms,
      viewBox,
      scaleX,
      scaleY
    );
  }
  const x1 = parseFloat(commands.x1) || 0;
  const y1 = parseFloat(commands.y1) || 0;
  const x2 = parseFloat(commands.x2) || 0;
  const y2 = parseFloat(commands.y2) || 0;

  const bbox = {
    minX: Math.min(x1, x2),
    minY: Math.min(y1, y2),
    maxX: Math.max(x1, x2),
    maxY: Math.max(y1, y2),
  };

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculatePolyBoundingBox(
  commands,
  viewBox,
  scaleX,
  scaleY,
  transforms
) {
  if (transforms && transforms.length > 0) {
    return calculateTransformedPolyBoundingBox(
      commands,
      transforms,
      viewBox,
      scaleX,
      scaleY
    );
  }

  if (!commands) return null;

  const points = commands;
  if (points.length === 0) return null;

  const bbox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  points.forEach((point) => {
    addPoint(bbox, point.x, point.y);
  });

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculateGroupBoundingBox(
  node,
  viewBox,
  scaleX,
  scaleY,
  inheritedTransforms = []
) {
  if (!node.children || node.children.length === 0) return null;

  const bbox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  const groupTransforms = [
    ...inheritedTransforms,
    ...(node.styles?.transform || []),
  ];

  for (const child of node.children) {
    const childTransforms = [
      ...groupTransforms,
      ...(child.styles?.transform || []),
    ];

    const childBbox = calculateBoundingBox(
      {
        ...child,
        styles: {
          ...child.styles,
          transform: childTransforms,
        },
      },
      viewBox,
      scaleX,
      scaleY
    );

    if (childBbox) {
      addPoint(bbox, childBbox.x, childBbox.y);
      addPoint(
        bbox,
        childBbox.x + childBbox.width,
        childBbox.y + childBbox.height
      );
    }
  }

  if (bbox.minX === Infinity) return null;

  return {
    x: bbox.minX,
    y: bbox.minY,
    width: bbox.maxX - bbox.minX,
    height: bbox.maxY - bbox.minY,
  };
}

// Helper functions for precise bezier curve bounding box calculation
export function addCubicBezierBounds(bbox, x0, y0, x1, y1, x2, y2, x3, y3) {
  addPoint(bbox, x0, y0);
  addPoint(bbox, x3, y3);

  // Find extrema by solving derivatives
  const a_x = -x0 + 3 * x1 - 3 * x2 + x3;
  const b_x = 2 * x0 - 4 * x1 + 2 * x2;
  const c_x = -x0 + x1;

  const t_vals_x = solveQuadratic(a_x, b_x, c_x);
  for (const t of t_vals_x) {
    if (t >= 0 && t <= 1) {
      const x =
        Math.pow(1 - t, 3) * x0 +
        3 * Math.pow(1 - t, 2) * t * x1 +
        3 * (1 - t) * Math.pow(t, 2) * x2 +
        Math.pow(t, 3) * x3;
      const y =
        Math.pow(1 - t, 3) * y0 +
        3 * Math.pow(1 - t, 2) * t * y1 +
        3 * (1 - t) * Math.pow(t, 2) * y2 +
        Math.pow(t, 3) * y3;
      addPoint(bbox, x, y);
    }
  }

  const a_y = -y0 + 3 * y1 - 3 * y2 + y3;
  const b_y = 2 * y0 - 4 * y1 + 2 * y2;
  const c_y = -y0 + y1;

  const t_vals_y = solveQuadratic(a_y, b_y, c_y);
  for (const t of t_vals_y) {
    if (t >= 0 && t <= 1) {
      const x =
        Math.pow(1 - t, 3) * x0 +
        3 * Math.pow(1 - t, 2) * t * x1 +
        3 * (1 - t) * Math.pow(t, 2) * x2 +
        Math.pow(t, 3) * x3;
      const y =
        Math.pow(1 - t, 3) * y0 +
        3 * Math.pow(1 - t, 2) * t * y1 +
        3 * (1 - t) * Math.pow(t, 2) * y2 +
        Math.pow(t, 3) * y3;
      addPoint(bbox, x, y);
    }
  }
}

export function addQuadraticBezierBounds(bbox, x0, y0, x1, y1, x2, y2) {
  addPoint(bbox, x0, y0);
  addPoint(bbox, x2, y2);

  // Find extrema
  const t_x = (x0 - x1) / (x0 - 2 * x1 + x2);
  if (t_x >= 0 && t_x <= 1 && !isNaN(t_x)) {
    const x =
      Math.pow(1 - t_x, 2) * x0 +
      2 * (1 - t_x) * t_x * x1 +
      Math.pow(t_x, 2) * x2;
    const y =
      Math.pow(1 - t_x, 2) * y0 +
      2 * (1 - t_x) * t_x * y1 +
      Math.pow(t_x, 2) * y2;
    addPoint(bbox, x, y);
  }

  const t_y = (y0 - y1) / (y0 - 2 * y1 + y2);
  if (t_y >= 0 && t_y <= 1 && !isNaN(t_y)) {
    const x =
      Math.pow(1 - t_y, 2) * x0 +
      2 * (1 - t_y) * t_y * x1 +
      Math.pow(t_y, 2) * x2;
    const y =
      Math.pow(1 - t_y, 2) * y0 +
      2 * (1 - t_y) * t_y * y1 +
      Math.pow(t_y, 2) * y2;
    addPoint(bbox, x, y);
  }
}

export function addArcBounds(
  bbox,
  x1,
  y1,
  rx,
  ry,
  rotation,
  largeArc,
  sweep,
  x2,
  y2
) {
  // Use the same elliptical arc calculation as the drawing function
  const bezierCurves = ellipticalArcToBezier(
    x1,
    y1,
    rx,
    ry,
    rotation,
    largeArc,
    sweep,
    x2,
    y2
  );

  // Add all Bezier curve control points and calculate extrema for precise bounds
  bezierCurves.forEach((bezier) => {
    addPoint(bbox, bezier.x1, bezier.y1);
    addPoint(bbox, bezier.x4, bezier.y4);

    // Calculate extrema of the cubic Bezier curve for more accurate bounds
    addCubicBezierBounds(
      bbox,
      bezier.x1,
      bezier.y1,
      bezier.x2,
      bezier.y2,
      bezier.x3,
      bezier.y3,
      bezier.x4,
      bezier.y4
    );
  });
}

export function solveQuadratic(a, b, c) {
  const solutions = [];

  if (Math.abs(a) < 1e-10) {
    if (Math.abs(b) > 1e-10) {
      solutions.push(-c / b);
    }
  } else {
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      const sqrt_d = Math.sqrt(discriminant);
      solutions.push((-b + sqrt_d) / (2 * a));
      solutions.push((-b - sqrt_d) / (2 * a));
    }
  }

  return solutions;
}

export function addPoint(bbox, x, y) {
  bbox.minX = Math.min(bbox.minX, x);
  bbox.minY = Math.min(bbox.minY, y);
  bbox.maxX = Math.max(bbox.maxX, x);
  bbox.maxY = Math.max(bbox.maxY, y);
}

// Transform the bounding box to the viewBox coordinates
export function transformBoundingBox(bbox, viewBox, scaleX, scaleY) {
  const x = (bbox.minX - viewBox.x) * scaleX;
  const y = (bbox.minY - viewBox.y) * scaleY;
  const width = (bbox.maxX - bbox.minX) * scaleX;
  const height = (bbox.maxY - bbox.minY) * scaleY;

  return { x, y, width, height };
}

// BASIC TRANSFORM: Calculate the bounding box of a transformed shape using the transformation matrix (used for rects)
export function calculateTransformedBoundingBox(
  localCorners,
  transforms,
  viewBox,
  scaleX,
  scaleY
) {
  // Use the shared transformation matrix builder
  const matrix = buildTransformationMatrix(transforms);

  function applyMatrixToPoint(matrix, point) {
    return {
      x: matrix.a * point.x + matrix.c * point.y + matrix.e,
      y: matrix.b * point.x + matrix.d * point.y + matrix.f,
    };
  }

  const globalCorners = localCorners.map((corner) =>
    applyMatrixToPoint(matrix, corner)
  );

  // Calculate bounding box from global corners
  const xs = globalCorners.map((corner) => corner.x);
  const ys = globalCorners.map((corner) => corner.y);

  const bbox = {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

/**
 * Calculate the bounding box of a transformed ellipse using analytical methods
 * This is more accurate than sampling for simple transformations
 */
function calculateEllipseBoundingBoxAnalytical(
  cx,
  cy,
  rx,
  ry,
  matrix,
  viewBox,
  scaleX,
  scaleY
) {
  // For a transformed ellipse, we can find the extreme points analytically
  // The transformed ellipse equation is: (x - centerX)²/a² + (y - centerY)²/b² = 1

  // Extract matrix components
  const { a, b, c, d, e, f } = matrix;

  // Calculate the transformed center
  const transformedCx = a * cx + c * cy + e;
  const transformedCy = b * cx + d * cy + f;

  // For rotation and scaling (no skew), we can calculate the new radii
  if (Math.abs(b) < 1e-10 && Math.abs(c) < 1e-10) {
    // No skew - simple scaling and rotation
    const newRx = Math.abs(a) * rx;
    const newRy = Math.abs(d) * ry;

    const bbox = {
      minX: transformedCx - newRx,
      minY: transformedCy - newRy,
      maxX: transformedCx + newRx,
      maxY: transformedCy + newRy,
    };

    return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
  }

  // For skew transformations, we need to find the extreme points
  // The extreme points occur where the derivative of the transformed ellipse is zero

  // Calculate the transformed ellipse parameters
  // The transformed ellipse has the form: Ax² + Bxy + Cy² + Dx + Ey + F = 0
  // where A, B, C, D, E, F are derived from the original ellipse and transformation matrix

  // For a unit circle (x² + y² = 1) transformed by matrix M, the equation becomes:
  // (M₁₁x + M₁₂y + M₁₃)² + (M₂₁x + M₂₂y + M₂₃)² = 1

  // This expands to a quadratic form that we can analyze

  // For now, fall back to sampling for complex transformations
  return null;
}

/**
 * Calculate bounding box by sampling points around a shape and transforming them
 */
function calculateBoundingBoxBySampling(
  cx,
  cy,
  rx,
  ry,
  matrix,
  viewBox,
  scaleX,
  scaleY,
  numSamples = 32
) {
  const transformedPoints = [];

  for (let i = 0; i < numSamples; i++) {
    const angle = (i * 2 * Math.PI) / numSamples;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);

    // Apply transformation matrix
    const transformedX = matrix.a * x + matrix.c * y + matrix.e;
    const transformedY = matrix.b * x + matrix.d * y + matrix.f;

    transformedPoints.push({ x: transformedX, y: transformedY });
  }

  // Calculate bounding box from transformed points
  const xs = transformedPoints.map((p) => p.x);
  const ys = transformedPoints.map((p) => p.y);

  const bbox = {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}
export function calculateTransformedCircleBoundingBox(
  commands,
  transforms,
  viewBox,
  scaleX,
  scaleY
) {
  const cx = parseFloat(commands.cx) || 0;
  const cy = parseFloat(commands.cy) || 0;
  const r = parseFloat(commands.r) || 0;

  // Build transformation matrix
  const matrix = buildTransformationMatrix(transforms);

  // Try analytical approach first (for simple transformations)
  const analyticalResult = calculateEllipseBoundingBoxAnalytical(
    cx,
    cy,
    r,
    r, // Circle has rx = ry = r
    matrix,
    viewBox,
    scaleX,
    scaleY
  );

  if (analyticalResult) {
    return analyticalResult;
  }

  // Fall back to sampling approach for complex transformations
  return calculateBoundingBoxBySampling(
    cx,
    cy,
    r,
    r,
    matrix,
    viewBox,
    scaleX,
    scaleY
  );
}

export function calculateTransformedEllipseBoundingBox(
  commands,
  transforms,
  viewBox,
  scaleX,
  scaleY
) {
  const cx = parseFloat(commands.cx) || 0;
  const cy = parseFloat(commands.cy) || 0;
  const rx = parseFloat(commands.rx) || 0;
  const ry = parseFloat(commands.ry) || 0;

  // Build transformation matrix
  const matrix = buildTransformationMatrix(transforms);

  // Try analytical approach first (for simple transformations)
  const analyticalResult = calculateEllipseBoundingBoxAnalytical(
    cx,
    cy,
    rx,
    ry,
    matrix,
    viewBox,
    scaleX,
    scaleY
  );

  if (analyticalResult) {
    return analyticalResult;
  }

  // Fall back to sampling approach for complex transformations
  return calculateBoundingBoxBySampling(
    cx,
    cy,
    rx,
    ry,
    matrix,
    viewBox,
    scaleX,
    scaleY
  );
}

export function calculateTransformedLineBoundingBox(
  commands,
  transforms,
  viewBox,
  scaleX,
  scaleY
) {
  const x1 = parseFloat(commands.x1) || 0;
  const y1 = parseFloat(commands.y1) || 0;
  const x2 = parseFloat(commands.x2) || 0;
  const y2 = parseFloat(commands.y2) || 0;

  // Build transformation matrix
  const matrix = buildTransformationMatrix(transforms);

  // Transform both endpoints
  const transformedX1 = matrix.a * x1 + matrix.c * y1 + matrix.e;
  const transformedY1 = matrix.b * x1 + matrix.d * y1 + matrix.f;
  const transformedX2 = matrix.a * x2 + matrix.c * y2 + matrix.e;
  const transformedY2 = matrix.b * x2 + matrix.d * y2 + matrix.f;

  // Calculate bounding box from transformed endpoints
  const bbox = {
    minX: Math.min(transformedX1, transformedX2),
    minY: Math.min(transformedY1, transformedY2),
    maxX: Math.max(transformedX1, transformedX2),
    maxY: Math.max(transformedY1, transformedY2),
  };

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculateTransformedPolyBoundingBox(
  commands,
  transforms,
  viewBox,
  scaleX,
  scaleY
) {
  if (!commands) return null;

  const points = commands;
  if (points.length === 0) return null;

  const matrix = buildTransformationMatrix(transforms);

  const transformedPoints = points.map((point) => ({
    x: matrix.a * point.x + matrix.c * point.y + matrix.e,
    y: matrix.b * point.x + matrix.d * point.y + matrix.f,
  }));

  const bbox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  transformedPoints.forEach((point) => {
    addPoint(bbox, point.x, point.y);
  });

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

/**
 * Add a transformed point to the bounding box
 */
function addTransformedPoint(bbox, x, y, matrix) {
  const transformedX = matrix.a * x + matrix.c * y + matrix.e;
  const transformedY = matrix.b * x + matrix.d * y + matrix.f;
  addPoint(bbox, transformedX, transformedY);
}

/**
 * Add transformed cubic Bézier curve bounds to the bounding box
 * This function handles skew transformations accurately by finding the true extrema
 * of the transformed curve
 */
function addTransformedCubicBezierBounds(
  bbox,
  x0,
  y0,
  x1,
  y1,
  x2,
  y2,
  x3,
  y3,
  matrix
) {
  // Transform all control points
  const p0 = {
    x: matrix.a * x0 + matrix.c * y0 + matrix.e,
    y: matrix.b * x0 + matrix.d * y0 + matrix.f,
  };
  const p1 = {
    x: matrix.a * x1 + matrix.c * y1 + matrix.e,
    y: matrix.b * x1 + matrix.d * y1 + matrix.f,
  };
  const p2 = {
    x: matrix.a * x2 + matrix.c * y2 + matrix.e,
    y: matrix.b * x2 + matrix.d * y2 + matrix.f,
  };
  const p3 = {
    x: matrix.a * x3 + matrix.c * y3 + matrix.e,
    y: matrix.b * x3 + matrix.d * y3 + matrix.f,
  };

  // Add endpoints
  addPoint(bbox, p0.x, p0.y);
  addPoint(bbox, p3.x, p3.y);

  // For skew transformations, we need to be more careful about finding extrema
  // The transformed curve may have different characteristics than the original

  // Find extrema by solving derivatives of the transformed curve
  // X-extrema: solve d/dt(x(t)) = 0
  const a_x = -p0.x + 3 * p1.x - 3 * p2.x + p3.x;
  const b_x = 2 * p0.x - 4 * p1.x + 2 * p2.x;
  const c_x = -p0.x + p1.x;

  const t_vals_x = solveQuadratic(a_x, b_x, c_x);
  for (const t of t_vals_x) {
    if (t >= 0 && t <= 1 && !isNaN(t)) {
      const x =
        Math.pow(1 - t, 3) * p0.x +
        3 * Math.pow(1 - t, 2) * t * p1.x +
        3 * (1 - t) * Math.pow(t, 2) * p2.x +
        Math.pow(t, 3) * p3.x;
      const y =
        Math.pow(1 - t, 3) * p0.y +
        3 * Math.pow(1 - t, 2) * t * p1.y +
        3 * (1 - t) * Math.pow(t, 2) * p2.y +
        Math.pow(t, 3) * p3.y;
      addPoint(bbox, x, y);
    }
  }

  // Y-extrema: solve d/dt(y(t)) = 0
  const a_y = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
  const b_y = 2 * p0.y - 4 * p1.y + 2 * p2.y;
  const c_y = -p0.y + p1.y;

  const t_vals_y = solveQuadratic(a_y, b_y, c_y);
  for (const t of t_vals_y) {
    if (t >= 0 && t <= 1 && !isNaN(t)) {
      const x =
        Math.pow(1 - t, 3) * p0.x +
        3 * Math.pow(1 - t, 2) * t * p1.x +
        3 * (1 - t) * Math.pow(t, 2) * p2.x +
        Math.pow(t, 3) * p3.x;
      const y =
        Math.pow(1 - t, 3) * p0.y +
        3 * Math.pow(1 - t, 2) * t * p1.y +
        3 * (1 - t) * Math.pow(t, 2) * p2.y +
        Math.pow(t, 3) * p3.y;
      addPoint(bbox, x, y);
    }
  }

  // For very skewed transformations, also check some additional sample points
  // to ensure we don't miss any extreme values
  const hasSkew = Math.abs(matrix.b) > 1e-10 || Math.abs(matrix.c) > 1e-10;
  if (hasSkew) {
    // Sample at additional points to catch any missed extrema
    const additionalSamples = [0.25, 0.5, 0.75];
    for (const t of additionalSamples) {
      const x =
        Math.pow(1 - t, 3) * p0.x +
        3 * Math.pow(1 - t, 2) * t * p1.x +
        3 * (1 - t) * Math.pow(t, 2) * p2.x +
        Math.pow(t, 3) * p3.x;
      const y =
        Math.pow(1 - t, 3) * p0.y +
        3 * Math.pow(1 - t, 2) * t * p1.y +
        3 * (1 - t) * Math.pow(t, 2) * p2.y +
        Math.pow(t, 3) * p3.y;
      addPoint(bbox, x, y);
    }
  }
}

/**
 * Add transformed quadratic Bézier curve bounds to the bounding box
 */
function addTransformedQuadraticBezierBounds(
  bbox,
  x0,
  y0,
  x1,
  y1,
  x2,
  y2,
  matrix
) {
  // Transform all control points
  const p0 = {
    x: matrix.a * x0 + matrix.c * y0 + matrix.e,
    y: matrix.b * x0 + matrix.d * y0 + matrix.f,
  };
  const p1 = {
    x: matrix.a * x1 + matrix.c * y1 + matrix.e,
    y: matrix.b * x1 + matrix.d * y1 + matrix.f,
  };
  const p2 = {
    x: matrix.a * x2 + matrix.c * y2 + matrix.e,
    y: matrix.b * x2 + matrix.d * y2 + matrix.f,
  };

  // Add endpoints
  addPoint(bbox, p0.x, p0.y);
  addPoint(bbox, p2.x, p2.y);

  // Find extrema by solving the derivative
  // For quadratic Bézier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
  // Derivative: B'(t) = 2(1-t)(P₁-P₀) + 2t(P₂-P₁) = 2[(P₁-P₀) + t(P₂-2P₁+P₀)]
  // Setting to zero: t = (P₀-P₁)/(P₀-2P₁+P₂)

  // X-extrema
  const denominator_x = p0.x - 2 * p1.x + p2.x;
  if (Math.abs(denominator_x) > 1e-10) {
    const t_x = (p0.x - p1.x) / denominator_x;
    if (t_x >= 0 && t_x <= 1 && !isNaN(t_x)) {
      const x =
        Math.pow(1 - t_x, 2) * p0.x +
        2 * (1 - t_x) * t_x * p1.x +
        Math.pow(t_x, 2) * p2.x;
      const y =
        Math.pow(1 - t_x, 2) * p0.y +
        2 * (1 - t_x) * t_x * p1.y +
        Math.pow(t_x, 2) * p2.y;
      addPoint(bbox, x, y);
    }
  }

  // Y-extrema
  const denominator_y = p0.y - 2 * p1.y + p2.y;
  if (Math.abs(denominator_y) > 1e-10) {
    const t_y = (p0.y - p1.y) / denominator_y;
    if (t_y >= 0 && t_y <= 1 && !isNaN(t_y)) {
      const x =
        Math.pow(1 - t_y, 2) * p0.x +
        2 * (1 - t_y) * t_y * p1.x +
        Math.pow(t_y, 2) * p2.x;
      const y =
        Math.pow(1 - t_y, 2) * p0.y +
        2 * (1 - t_y) * t_y * p1.y +
        Math.pow(t_y, 2) * p2.y;
      addPoint(bbox, x, y);
    }
  }

  // For skewed transformations, add additional safety samples
  const hasSkew = Math.abs(matrix.b) > 1e-10 || Math.abs(matrix.c) > 1e-10;
  if (hasSkew) {
    // Sample at additional points to ensure we catch all extrema
    const additionalSamples = [0.25, 0.5, 0.75];
    for (const t of additionalSamples) {
      const x =
        Math.pow(1 - t, 2) * p0.x +
        2 * (1 - t) * t * p1.x +
        Math.pow(t, 2) * p2.x;
      const y =
        Math.pow(1 - t, 2) * p0.y +
        2 * (1 - t) * t * p1.y +
        Math.pow(t, 2) * p2.y;
      addPoint(bbox, x, y);
    }
  }
}

/**
 * Add transformed elliptical arc bounds to the bounding box
 * This function handles skew transformations accurately by sampling the arc
 * at strategic points and transforming each sample
 */
function addTransformedArcBounds(
  bbox,
  x1,
  y1,
  rx,
  ry,
  rotation,
  largeArc,
  sweep,
  x2,
  y2,
  matrix
) {
  // For complex transformations (especially skew), we need to sample the arc
  // and transform each sample point rather than trying to transform the arc parameters

  // Convert the arc to a series of points by sampling
  const numSamples = 32; // Increased for better accuracy with skew
  const points = [];

  // Calculate the center and angles of the arc
  const phi = (rotation * Math.PI) / 180;

  // Step 1: Compute (x1′, y1′)
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1Prime = Math.cos(phi) * dx + Math.sin(phi) * dy;
  const y1Prime = -Math.sin(phi) * dx + Math.cos(phi) * dy;

  // Step 2: Compute (cx′, cy′) with radius correction
  let rxSq = rx * rx;
  let rySq = ry * ry;
  const x1PrimeSq = x1Prime * x1Prime;
  const y1PrimeSq = y1Prime * y1Prime;

  const radiiCheck = x1PrimeSq / rxSq + y1PrimeSq / rySq;
  if (radiiCheck > 1) {
    rx = Math.sqrt(radiiCheck) * rx;
    ry = Math.sqrt(radiiCheck) * ry;
    rxSq = rx * rx;
    rySq = ry * ry;
  }

  const sign = largeArc === sweep ? -1 : 1;
  const pq =
    (rxSq * rySq - rxSq * y1PrimeSq - rySq * x1PrimeSq) /
    (rxSq * y1PrimeSq + rySq * x1PrimeSq);
  const coef = sign * Math.sqrt(Math.max(0, pq));
  const cxPrime = (coef * (rx * y1Prime)) / ry;
  const cyPrime = (coef * (-ry * x1Prime)) / rx;

  // Step 3: Compute center (cx, cy)
  const cx = Math.cos(phi) * cxPrime - Math.sin(phi) * cyPrime + (x1 + x2) / 2;
  const cy = Math.sin(phi) * cxPrime + Math.cos(phi) * cyPrime + (y1 + y2) / 2;

  // Step 4: Compute angles
  const startAngle = Math.atan2(
    (y1Prime - cyPrime) / ry,
    (x1Prime - cxPrime) / rx
  );
  let deltaAngle =
    Math.atan2((-y1Prime - cyPrime) / ry, (-x1Prime - cxPrime) / rx) -
    startAngle;

  // Normalize delta angle based on flags
  if (!sweep && deltaAngle > 0) deltaAngle -= 2 * Math.PI;
  else if (sweep && deltaAngle < 0) deltaAngle += 2 * Math.PI;

  // Sample the arc at regular intervals
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const angle = startAngle + t * deltaAngle;

    // Calculate point on the arc
    const x = rx * Math.cos(angle);
    const y = ry * Math.sin(angle);

    // Apply the arc's rotation
    const rotatedX = x * Math.cos(phi) - y * Math.sin(phi) + cx;
    const rotatedY = x * Math.sin(phi) + y * Math.cos(phi) + cy;

    // Transform the point using the transformation matrix
    const transformedX = matrix.a * rotatedX + matrix.c * rotatedY + matrix.e;
    const transformedY = matrix.b * rotatedX + matrix.d * rotatedY + matrix.f;

    // Add to bounding box
    addPoint(bbox, transformedX, transformedY);
  }
}
