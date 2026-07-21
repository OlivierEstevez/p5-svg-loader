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

const PATH_STROKE_COLOR = 150;
const HANDLE_COLOR = "#E94900";
const ANCHOR_STROKE_COLOR = "#008FE9";
const HANDLE_SIZE = 6;
const ANCHOR_SIZE = 8;

const DEBUG_SHAPE_TYPES = new Set([
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
]);

export function drawDebugNode(
  p,
  node,
  viewBox,
  scaleX,
  scaleY,
  inheritedTransforms = []
) {
  if (!node) return;

  const nodeTransforms = Array.isArray(node.styles?.transform)
    ? node.styles.transform
    : [];
  const totalTransforms = [...inheritedTransforms, ...nodeTransforms];

  drawDebugShape(p, node, viewBox, scaleX, scaleY, totalTransforms);

  if (DEBUG_SHAPE_TYPES.has(node.type)) {
    drawDebugPath(p, node, viewBox, scaleX, scaleY, totalTransforms);
  }

  if (Array.isArray(node.children) && node.children.length > 0) {
    node.children.forEach((child) => {
      drawDebugNode(p, child, viewBox, scaleX, scaleY, totalTransforms);
    });
  }
}

export function drawDebugShape(
  p,
  node,
  viewBox,
  scaleX,
  scaleY,
  totalTransforms = []
) {
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

  if (bbox) {
    p.push();
    p.noFill();

    const nodeDirectTransforms = Array.isArray(node.styles?.transform)
      ? node.styles.transform
      : [];

    if (node.type === "group") {
      if (nodeDirectTransforms.length > 0) {
        // Groups with DIRECT transforms
        p.stroke("green");
        p.strokeWeight(4);

        const padding = 10; // TO-DO: Improve padding option. Make customizable ?
        if (padding) {
          bbox.x -= padding;
          bbox.y -= padding;
          bbox.width += padding * 2;
          bbox.height += padding * 2;
        }
      } else {
        // Groups with NO DIRECT transforms
        p.stroke(0, 0, 255);
        p.strokeWeight(3);
      }
    } else {
      // Shapes
      p.stroke(255, 0, 0);
      p.strokeWeight(1);
    }

    p.rect(bbox.x, bbox.y, bbox.width, bbox.height);
    p.pop();
  }
}

/**
 * Draw path stroke, bezier handles, and anchor points for any shape node.
 * Non-path shapes are converted to path commands first.
 */
function drawDebugPath(p, node, viewBox, scaleX, scaleY, totalTransforms) {
  const flattened = flattenTransforms({
    ...node,
    styles: {
      ...node.styles,
      // Apply accumulated transforms below — avoid double-applying node transforms
      transform: undefined,
    },
  });

  const rawCommands = flattened?.commands;
  if (!rawCommands || rawCommands.length === 0) return;

  // applyTransformsToPath already normalizes relative → absolute
  let commands = applyTransformsToPath(rawCommands, totalTransforms);
  commands = expandSmoothCommands(commands);
  commands = expandArcsToCubics(commands);
  commands = scaleCommands(commands, viewBox, scaleX, scaleY);

  drawPathStroke(p, commands);
  drawBezierHandles(p, commands, HANDLE_SIZE);
  drawAnchorPoints(p, commands, ANCHOR_SIZE);
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

function drawPathStroke(p, commands) {
  p.push();
  p.noFill();
  p.stroke(PATH_STROKE_COLOR);
  p.strokeWeight(1);

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

function drawBezierHandles(p, commands, size) {
  p.push();
  p.noFill();
  p.stroke(HANDLE_COLOR);
  p.strokeWeight(2);

  let lastX;
  let lastY;

  for (const cmd of commands) {
    if (cmd.type === "C") {
      p.line(lastX, lastY, cmd.x1, cmd.y1);
      p.line(cmd.x2, cmd.y2, cmd.x, cmd.y);
      p.fill(HANDLE_COLOR);
      drawDiamond(p, cmd.x1, cmd.y1, size);
      drawDiamond(p, cmd.x2, cmd.y2, size);
      p.noFill();
    } else if (cmd.type === "Q") {
      p.line(lastX, lastY, cmd.x1, cmd.y1);
      p.line(cmd.x1, cmd.y1, cmd.x, cmd.y);
      p.fill(HANDLE_COLOR);
      drawDiamond(p, cmd.x1, cmd.y1, size);
      p.noFill();
    }

    if (cmd.x != null && cmd.y != null) {
      lastX = cmd.x;
      lastY = cmd.y;
    }
  }

  p.pop();
}

function drawAnchorPoints(p, commands, size) {
  p.push();
  p.fill(255);
  p.stroke(ANCHOR_STROKE_COLOR);
  p.strokeWeight(2);

  for (const cmd of commands) {
    if (cmd.x != null && cmd.y != null) {
      p.circle(cmd.x, cmd.y, size);
    }
  }

  p.pop();
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
