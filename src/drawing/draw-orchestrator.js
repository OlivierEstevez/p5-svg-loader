/**
 * Main drawing orchestrator that coordinates all SVG element drawing
 */

import { applyStyles } from "../core/utils.js";
import {
  drawRect,
  drawCircle,
  drawEllipse,
  drawLine,
  drawPolyline,
  drawPolygon,
  drawText,
} from "./shapes.js";
import { drawPath } from "./path.js";

export function drawNode(p, svgData, viewBox, scaleX, scaleY, options) {
  if (!svgData) return;

  if (svgData.tagName && svgData.tagName !== "svg") {
    drawShape(p, svgData, viewBox, scaleX, scaleY, options);
  }

  if (svgData.children && svgData.children.length > 0) {
    svgData.children.forEach((child) => {
      drawShape(p, child, viewBox, scaleX, scaleY, options);
      if (child.children && child.children.length > 0) {
        drawNode(p, child, viewBox, scaleX, scaleY, options);
      }
    });
  }
}

export function drawShape(p, node, viewBox, scaleX, scaleY, options) {
  const props = node.properties || {};
  const children = node.children || {};

  if (!options.ignoreStyles) {
    applyStyles(p, props);
  }

  switch (node.tagName) {
    case "path":
      drawPath(p, props.d, viewBox, scaleX, scaleY);
      break;
    case "rect":
      drawRect(p, props, viewBox, scaleX, scaleY);
      break;
    case "circle":
      drawCircle(p, props, viewBox, scaleX, scaleY);
      break;
    case "ellipse":
      drawEllipse(p, props, viewBox, scaleX, scaleY);
      break;
    case "line":
      drawLine(p, props, viewBox, scaleX, scaleY);
      break;
    case "polyline":
      drawPolyline(p, props, viewBox, scaleX, scaleY);
      break;
    case "polygon":
      drawPolygon(p, props, viewBox, scaleX, scaleY);
      break;
    case "text":
      drawText(p, props, children, viewBox, scaleX, scaleY);
      break;
  }
}
