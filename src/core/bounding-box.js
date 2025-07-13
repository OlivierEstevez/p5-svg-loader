import { ellipticalArcToBezier } from "../drawing/path";

export function calculateBoundingBox(node, viewBox, scaleX, scaleY) {
  switch (node.type || node.tagName) {
    case "group":
      return calculateGroupBoundingBox(node, viewBox, scaleX, scaleY);
    case "path":
      return calculatePathBoundingBox(node.commands, viewBox, scaleX, scaleY);
    case "rect":
      return calculateRectBoundingBox(
        node.commands[0],
        viewBox,
        scaleX,
        scaleY
      );
    case "circle":
      return calculateCircleBoundingBox(
        node.commands[0],
        viewBox,
        scaleX,
        scaleY
      );
    case "ellipse":
      return calculateEllipseBoundingBox(
        node.commands[0],
        viewBox,
        scaleX,
        scaleY
      );
    case "line":
      return calculateLineBoundingBox(node.commands, viewBox, scaleX, scaleY);
    case "polyline":
    case "polygon":
      return calculatePolyBoundingBox(node.commands, viewBox, scaleX, scaleY);
    case "text":
      return calculateTextBoundingBox(
        node.commands,
        node.children,
        viewBox,
        scaleX,
        scaleY
      );
    default:
      return null;
  }
}

export function calculatePathBoundingBox(d, viewBox, scaleX, scaleY) {
  if (!d) return null;

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

export function calculateRectBoundingBox(commands, viewBox, scaleX, scaleY) {
  const x = parseFloat(commands.x) || 0;
  const y = parseFloat(commands.y) || 0;
  const width = parseFloat(commands.width) || 0;
  const height = parseFloat(commands.height) || 0;

  const bbox = { minX: x, minY: y, maxX: x + width, maxY: y + height };
  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculateCircleBoundingBox(commands, viewBox, scaleX, scaleY) {
  const cx = parseFloat(commands.cx) || 0;
  const cy = parseFloat(commands.cy) || 0;
  const r = parseFloat(commands.r) || 0;

  const bbox = { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r };
  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculateEllipseBoundingBox(commands, viewBox, scaleX, scaleY) {
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

export function calculateLineBoundingBox(commands, viewBox, scaleX, scaleY) {
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

export function calculatePolyBoundingBox(commands, viewBox, scaleX, scaleY) {
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

export function calculateTextBoundingBox(
  props,
  children,
  viewBox,
  scaleX,
  scaleY
) {
  const x = parseFloat(props.x) || 0;
  const y = parseFloat(props.y) || 0;
  const textContent = children ? children[0].value : "";

  if (!textContent) return null;

  // Simple text bounding box approximation
  const fontSize = parseFloat(props["font-size"]) || 10;
  const bbox = {
    minX: x,
    minY: y - fontSize,
    maxX: x + textContent.length * fontSize * 0.6,
    maxY: y,
  };

  return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
}

export function calculateGroupBoundingBox(node, viewBox, scaleX, scaleY) {
  if (!node.children || node.children.length === 0) return null;

  const groupBbox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  // Calculate bounding box by combining all child element bounds
  for (const child of node.children) {
    const childBbox = calculateBoundingBox(child, viewBox, scaleX, scaleY);
    if (childBbox) {
      // Convert back to viewBox coordinates for proper combination
      const childMinX = childBbox.x / scaleX + viewBox.x;
      const childMinY = childBbox.y / scaleY + viewBox.y;
      const childMaxX = childMinX + childBbox.width / scaleX;
      const childMaxY = childMinY + childBbox.height / scaleY;

      groupBbox.minX = Math.min(groupBbox.minX, childMinX);
      groupBbox.minY = Math.min(groupBbox.minY, childMinY);
      groupBbox.maxX = Math.max(groupBbox.maxX, childMaxX);
      groupBbox.maxY = Math.max(groupBbox.maxY, childMaxY);
    }
  }

  if (groupBbox.minX === Infinity) return null;

  return transformBoundingBox(groupBbox, viewBox, scaleX, scaleY);
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

export function transformBoundingBox(bbox, viewBox, scaleX, scaleY) {
  const x = (bbox.minX - viewBox.x) * scaleX;
  const y = (bbox.minY - viewBox.y) * scaleY;
  const width = (bbox.maxX - bbox.minX) * scaleX;
  const height = (bbox.maxY - bbox.minY) * scaleY;

  return { x, y, width, height };
}
