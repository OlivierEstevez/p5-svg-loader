/**
 * Main drawing orchestrator that coordinates all SVG element drawing
 */

import {
  drawPath,
  drawRect,
  drawCircle,
  drawEllipse,
  drawLine,
  drawPolyline,
  drawPolygon,
  drawText,
} from "./shapes.js";

/**
 * Draw a parsed SVG element using pre-computed commands
 * @param {Object} p - p5.js instance
 * @param {Object} element - Parsed element object
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 * @param {Object} options - Drawing options
 */
export function drawParsedElement(
  p,
  element,
  viewBox,
  scaleX,
  scaleY,
  options
) {
  if (!element) return;

  // Apply styles if not ignored
  if (!options.ignoreStyles && element.styles) {
    applyStyles(p, element.styles);
  }

  // Execute commands based on element type
  switch (element.type) {
    case "path":
      drawPath(p, element.commands, viewBox, scaleX, scaleY);
      break;
    case "rect":
      drawRect(p, element.commands[0], viewBox, scaleX, scaleY);
      break;
    case "circle":
      drawCircle(p, element.commands[0], viewBox, scaleX, scaleY);
      break;
    case "ellipse":
      drawEllipse(p, element.commands[0], viewBox, scaleX, scaleY);
      break;
    case "line":
      drawLine(p, element.commands[0], viewBox, scaleX, scaleY);
      break;
    case "polyline":
      drawPolyline(p, element.commands, viewBox, scaleX, scaleY);
      break;
    case "polygon":
      drawPolygon(p, element.commands, viewBox, scaleX, scaleY);
      break;
    case "text":
      drawText(p, element.commands[0], viewBox, scaleX, scaleY);
      break;
    case "group":
      // Recursively draw group children
      if (element.children && element.children.length > 0) {
        element.children.forEach((child) => {
          drawParsedElement(p, child, viewBox, scaleX, scaleY, options);
        });
      }
      break;
  }
}

/**
 * Draw all elements in a parsed SVG
 * @param {Object} p - p5.js instance
 * @param {Object} svg - Parsed SVG object
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 * @param {Object} options - Drawing options
 */
export function drawParsedSVG(p, svg, viewBox, scaleX, scaleY, options) {
  if (!svg) return;

  drawParsedElement(p, svg, viewBox, scaleX, scaleY, options);

  if (Array.isArray(svg.children) && svg.children.length > 0) {
    svg.children.forEach((element) => {
      drawParsedElement(p, element, viewBox, scaleX, scaleY, options);
    });
  }
}

/**
 * Apply styles from pre-processed styles object
 * @param {Object} p - p5.js instance
 * @param {Object} styles - Pre-processed styles object
 */
function applyStyles(p, styles) {
  p.noStroke();
  p.noFill();
  p.textSize(10);
  p.textAlign(p.LEFT);
  p.textFont("Arial");
  p.textStyle(p.NORMAL);
  p.drawingContext.globalAlpha = 1;

  // Apply fill
  if (styles.fill === "none") {
    p.noFill();
  } else if (styles.fill) {
    p.fill(styles.fill);
  }

  // Apply stroke
  if (styles.stroke === "none") {
    p.noStroke();
  } else if (styles.stroke) {
    p.stroke(styles.stroke);
  }

  // Apply stroke width
  if (styles.strokeWidth) {
    p.strokeWeight(styles.strokeWidth);
  }

  // Apply font properties
  if (styles.fontSize) {
    p.textSize(styles.fontSize);
  }

  if (styles.fontFamily) {
    p.textFont(styles.fontFamily);
  }

  if (styles.textAnchor) {
    switch (styles.textAnchor) {
      case "middle":
        p.textAlign(p.CENTER);
        break;
      case "end":
        p.textAlign(p.RIGHT);
        break;
      default:
        p.textAlign(p.LEFT);
        break;
    }
  }

  // Apply opacity
  if (styles.opacity !== undefined) {
    p.drawingContext.globalAlpha = styles.opacity;
  }
}
