/**
 * Debug drawing functions for visualizing SVG element bounds
 */

import { calculateBoundingBox } from "../core/bounding-box.js";

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
