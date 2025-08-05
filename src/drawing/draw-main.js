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
  // Fill
  p.noFill();
  p.drawingContext.globalAlpha = 1;

  // Stroke
  p.noStroke();
  p.strokeWeight(1);
  p.strokeCap(p.ROUND);
  p.strokeJoin(p.MITER);
  p.drawingContext.setLineDash([]);
  p.drawingContext.lineDashOffset = 0;

  // Text
  p.textSize(10);
  p.textAlign(p.LEFT);
  p.textFont("Arial");
  p.textStyle(p.NORMAL);

  if (styles.fill === "none") {
    p.noFill();
  } else if (styles.fill) {
    p.fill(styles.fill);
  }

  if (
    styles.fillOpacity !== undefined &&
    styles.fill &&
    styles.fill !== "none"
  ) {
    const colorString = p
      .color(styles.fill)
      .toString("rgba")
      .match(/[\d.]+%?/g)
      .map((v) =>
        v.includes("%") ? Math.round(parseFloat(v) * 2.55) : parseInt(v)
      );
    p.fill(
      colorString[0],
      colorString[1],
      colorString[2],
      Math.round(styles.fillOpacity * 255)
    );
  }

  if (styles.stroke === "none") {
    p.noStroke();
  } else if (styles.stroke) {
    p.stroke(styles.stroke);
  }

  if (
    styles.strokeOpacity !== undefined &&
    styles.stroke &&
    styles.stroke !== "none"
  ) {
    const colorString = p
      .color(styles.stroke)
      .toString("rgba")
      .match(/[\d.]+%?/g)
      .map((v) =>
        v.includes("%") ? Math.round(parseFloat(v) * 2.55) : parseInt(v)
      );
    p.stroke(
      colorString[0],
      colorString[1],
      colorString[2],
      Math.round(styles.strokeOpacity * 255)
    );
  }

  if (styles.strokeWidth) {
    p.strokeWeight(styles.strokeWidth);
  }

  if (styles.strokeLinecap) {
    switch (styles.strokeLinecap) {
      case "butt":
        p.strokeCap(p.SQUARE);
        break;
      case "round":
        p.strokeCap(p.ROUND);
        break;
      case "square":
        p.strokeCap(p.PROJECT);
        break;
      default:
        p.strokeCap(p.ROUND);
        break;
    }
  }

  if (styles.strokeLinejoin) {
    switch (styles.strokeLinejoin) {
      case "miter":
        p.strokeJoin(p.MITER);
        break;
      case "round":
        p.strokeJoin(p.ROUND);
        break;
      case "bevel":
        p.strokeJoin(p.BEVEL);
        break;
      default:
        p.strokeJoin(p.MITER);
        break;
    }
  }

  if (styles.strokeDasharray !== undefined) {
    if (styles.strokeDasharray === null) {
      p.drawingContext.setLineDash([]);
    } else if (Array.isArray(styles.strokeDasharray)) {
      p.drawingContext.setLineDash(styles.strokeDasharray);
    }

    if (styles.strokeDashoffset !== undefined) {
      p.drawingContext.lineDashOffset = styles.strokeDashoffset;
    }
  }

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

  if (styles.opacity !== undefined) {
    p.drawingContext.globalAlpha = styles.opacity;
  }
}
