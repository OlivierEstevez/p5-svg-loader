/**
 * Debug drawing functions for visualizing SVG element bounds
 */

import { calculateBoundingBox } from "../core/bounding-box.js";

export function drawDebugNode(p, node, viewBox, scaleX, scaleY) {
  if (!node) return;

  drawDebugShape(p, node, viewBox, scaleX, scaleY);

  if (Array.isArray(node.children) && node.children.length > 0) {
    node.children.forEach((child) => {
      drawDebugNode(p, child, viewBox, scaleX, scaleY);
    });
  }
}

export function drawDebugShape(p, node, viewBox, scaleX, scaleY) {
  const bbox = calculateBoundingBox(node, viewBox, scaleX, scaleY);

  if (bbox) {
    // Draw bounding box - blue for groups, red for other elements
    p.push();
    p.noFill();
    p.stroke(
      node.type === "group" ? 0 : 255,
      0,
      node.type === "group" ? 255 : 0
    );
    p.strokeWeight(node.type === "group" ? 4 : 1);
    p.rect(bbox.x, bbox.y, bbox.width, bbox.height);
    p.pop();
  }
}
