/**
 * Debug drawing functions for visualizing SVG element bounds,
 * path strokes, anchor points, and bezier handles.
 */

import { calculateBoundingBox } from "../core/bounding-box.js";
import {
  applyTransformsToPath,
  expandSmoothCommands,
} from "../core/transform-utils.js";
import { transformCoord } from "../core/utils.js";
import { expandArcsToCubics, flattenTransforms } from "./path.js";

const DEBUG_SHAPE_TYPES = new Set([
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
]);

const DEFAULT_OPTIONS = {
  elementBoundingBoxes: {
    show: true,
    stroke: "#ff0000",
    strokeWeight: 1,
    fill: null,
    fillOpacity: 1,
    padding: 0,
    cornerShape: null,
  },
  groupBoundingBoxes: {
    show: true,
    stroke: "#0000ff",
    strokeWeight: 1,
    fill: null,
    fillOpacity: 1,
    padding: 0,
    cornerShape: null,
  },
  transformedGroupBoundingBoxes: {
    show: true,
    stroke: "#008000",
    strokeWeight: 1,
    fill: null,
    fillOpacity: 1,
    padding: 10,
    cornerShape: null,
  },
  shape: {
    show: true,
    stroke: 150,
    strokeWeight: 1,
  },
  shapePoint: {
    show: true,
    stroke: "#008FE9",
    strokeWeight: 1,
    fill: 255,
    fillOpacity: 1,
    customShape: null,
  },
  shapeBezier: {
    show: true,
    stroke: "#E94900",
    strokeWeight: 1,
    fill: "#E94900",
    fillOpacity: 1,
    customShape: null,
  },
};

/**
 * Merge user debug options onto defaults (shallow per section).
 * @param {Object} userOptions
 * @returns {Object}
 */
export function resolveDebugOptions(userOptions = {}) {
  const resolved = {};

  for (const key of Object.keys(DEFAULT_OPTIONS)) {
    resolved[key] = {
      ...DEFAULT_OPTIONS[key],
      ...(userOptions[key] || {}),
    };
  }

  return resolved;
}

export function drawDebugNode(
  p,
  node,
  viewBox,
  scaleX,
  scaleY,
  inheritedTransforms = [],
  options = resolveDebugOptions()
) {
  if (!node) return;

  const nodeTransforms = Array.isArray(node.styles?.transform)
    ? node.styles.transform
    : [];
  const totalTransforms = [...inheritedTransforms, ...nodeTransforms];

  drawDebugBoundingBox(p, node, viewBox, scaleX, scaleY, totalTransforms, options);

  if (DEBUG_SHAPE_TYPES.has(node.type)) {
    drawDebugPath(p, node, viewBox, scaleX, scaleY, totalTransforms, options);
  }

  if (Array.isArray(node.children) && node.children.length > 0) {
    node.children.forEach((child) => {
      drawDebugNode(
        p,
        child,
        viewBox,
        scaleX,
        scaleY,
        totalTransforms,
        options
      );
    });
  }
}

function drawDebugBoundingBox(
  p,
  node,
  viewBox,
  scaleX,
  scaleY,
  totalTransforms,
  options
) {
  let config;
  if (node.type === "group") {
    const nodeDirectTransforms = Array.isArray(node.styles?.transform)
      ? node.styles.transform
      : [];
    config =
      nodeDirectTransforms.length > 0
        ? options.transformedGroupBoundingBoxes
        : options.groupBoundingBoxes;
  } else if (DEBUG_SHAPE_TYPES.has(node.type)) {
    config = options.elementBoundingBoxes;
  } else {
    return;
  }

  if (!config.show) return;

  const nodeWithTransforms = {
    ...node,
    styles: {
      ...node.styles,
      transform: totalTransforms,
    },
  };

  const bbox = calculateBoundingBox(
    nodeWithTransforms,
    viewBox,
    scaleX,
    scaleY
  );

  if (!bbox) return;

  const padding = config.padding || 0;
  const x = bbox.x - padding;
  const y = bbox.y - padding;
  const w = bbox.width + padding * 2;
  const h = bbox.height + padding * 2;

  p.push();
  applyStrokeFill(p, config);
  p.rect(x, y, w, h);
  p.pop();

  if (typeof config.cornerShape === "function") {
    const corners = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
    for (const [cx, cy] of corners) {
      invokeCustomShape(p, config.cornerShape, cx, cy);
    }
  }
}

/**
 * Draw path stroke, bezier handles, and anchor points for any shape node.
 */
function drawDebugPath(
  p,
  node,
  viewBox,
  scaleX,
  scaleY,
  totalTransforms,
  options
) {
  const flattened = flattenTransforms({
    ...node,
    styles: {
      ...node.styles,
      transform: undefined,
    },
  });

  const rawCommands = flattened?.commands;
  if (!rawCommands || rawCommands.length === 0) return;

  let commands = applyTransformsToPath(rawCommands, totalTransforms);
  commands = expandSmoothCommands(commands);
  commands = expandArcsToCubics(commands);
  commands = scaleCommands(commands, viewBox, scaleX, scaleY);

  if (options.shape.show) {
    drawPathStroke(p, commands, options.shape);
  }
  if (options.shapeBezier.show) {
    drawBezierHandles(p, commands, options.shapeBezier);
  }
  if (options.shapePoint.show) {
    drawAnchorPoints(p, commands, options.shapePoint);
  }
}

function scaleCommands(commands, viewBox, scaleX, scaleY) {
  return commands.map((cmd) => {
    if (cmd.type === "Z") return { type: "Z" };

    const scaled = { type: cmd.type };

    if (cmd.x != null && cmd.y != null) {
      const end = transformCoord(cmd.x, cmd.y, viewBox, scaleX, scaleY);
      scaled.x = end.x;
      scaled.y = end.y;
    }

    if (cmd.x1 != null && cmd.y1 != null) {
      const c1 = transformCoord(cmd.x1, cmd.y1, viewBox, scaleX, scaleY);
      scaled.x1 = c1.x;
      scaled.y1 = c1.y;
    }

    if (cmd.x2 != null && cmd.y2 != null) {
      const c2 = transformCoord(cmd.x2, cmd.y2, viewBox, scaleX, scaleY);
      scaled.x2 = c2.x;
      scaled.y2 = c2.y;
    }

    return scaled;
  });
}

function drawPathStroke(p, commands, config) {
  p.push();
  p.noFill();
  if (config.stroke != null && config.stroke !== "none") {
    p.stroke(config.stroke);
  } else {
    p.noStroke();
  }
  if (config.strokeWeight != null) {
    p.strokeWeight(config.strokeWeight);
  }

  let shapeOpen = false;

  for (const cmd of commands) {
    if (cmd.type === "M") {
      if (shapeOpen) p.endShape();
      p.beginShape();
      p.vertex(cmd.x, cmd.y);
      shapeOpen = true;
    } else if (cmd.type === "L") {
      p.vertex(cmd.x, cmd.y);
    } else if (cmd.type === "C") {
      drawCubicVertex(p, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    } else if (cmd.type === "Q") {
      drawQuadraticVertex(p, cmd.x1, cmd.y1, cmd.x, cmd.y);
    } else if (cmd.type === "Z") {
      p.endShape(p.CLOSE);
      shapeOpen = false;
    }
  }

  if (shapeOpen) p.endShape();
  p.pop();
}

function drawBezierHandles(p, commands, config) {
  p.push();
  applyStrokeFill(p, config);

  let lastX;
  let lastY;

  for (const cmd of commands) {
    if (cmd.type === "C") {
      p.line(lastX, lastY, cmd.x1, cmd.y1);
      p.line(cmd.x2, cmd.y2, cmd.x, cmd.y);
      drawHandleMarker(p, cmd.x1, cmd.y1, config);
      drawHandleMarker(p, cmd.x2, cmd.y2, config);
    } else if (cmd.type === "Q") {
      p.line(lastX, lastY, cmd.x1, cmd.y1);
      p.line(cmd.x1, cmd.y1, cmd.x, cmd.y);
      drawHandleMarker(p, cmd.x1, cmd.y1, config);
    }

    if (cmd.x != null && cmd.y != null) {
      lastX = cmd.x;
      lastY = cmd.y;
    }
  }

  p.pop();
}

function drawHandleMarker(p, x, y, config) {
  if (typeof config.customShape === "function") {
    invokeCustomShape(p, config.customShape, x, y);
    return;
  }

  p.push();
  applyStrokeFill(p, config);
  drawDiamond(p, x, y, 6);
  p.pop();
}

function drawAnchorPoints(p, commands, config) {
  for (const cmd of commands) {
    if (cmd.x == null || cmd.y == null) continue;

    if (typeof config.customShape === "function") {
      invokeCustomShape(p, config.customShape, cmd.x, cmd.y);
      continue;
    }

    p.push();
    applyStrokeFill(p, config);
    p.circle(cmd.x, cmd.y, 8);
    p.pop();
  }
}

/**
 * Invoke a user customShape / cornerShape callback with `this` bound to the p5 instance.
 * Automatically wraps push/pop. Draw at the given (x, y) — e.g. ellipse(x, y, 20).
 * Global mode: bare ellipse(). Instance mode: this.ellipse().
 */
function invokeCustomShape(p, customShape, x, y) {
  p.push();
  customShape.call(p, x, y);
  p.pop();
}

function applyStrokeFill(p, config) {
  if (config.stroke != null && config.stroke !== "none") {
    p.stroke(config.stroke);
  } else {
    p.noStroke();
  }

  if (config.strokeWeight != null) {
    p.strokeWeight(config.strokeWeight);
  }

  if (config.fill == null || config.fill === "none") {
    p.noFill();
  } else {
    applyFillWithOpacity(p, config.fill, config.fillOpacity);
  }
}

function applyFillWithOpacity(p, fill, fillOpacity = 1) {
  if (fillOpacity == null || fillOpacity >= 1) {
    p.fill(fill);
    return;
  }

  const c = p.color(fill);
  p.fill(p.red(c), p.green(c), p.blue(c), Math.round(fillOpacity * 255));
}

function drawDiamond(p, x, y, size) {
  p.push();
  p.translate(x, y);
  p.rotate(p.PI / 4);
  p.rectMode(p.CENTER);
  p.rect(0, 0, size, size);
  p.pop();
}

function drawCubicVertex(p, x1, y1, x2, y2, x, y) {
  if (p.bezierOrder) {
    p.bezierOrder(3);
    p.bezierVertex(x1, y1);
    p.bezierVertex(x2, y2);
    p.bezierVertex(x, y);
  } else {
    p.bezierVertex(x1, y1, x2, y2, x, y);
  }
}

function drawQuadraticVertex(p, x1, y1, x, y) {
  if (p.bezierOrder) {
    p.bezierOrder(2);
    p.bezierVertex(x1, y1);
    p.bezierVertex(x, y);
  } else {
    p.quadraticVertex(x1, y1, x, y);
  }
}
