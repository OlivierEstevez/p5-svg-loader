/**
 * Drawing functions for basic SVG shapes
 */

import { transformCoord } from "../core/utils.js";
import { ellipticalArcToBezier } from "./path.js";
import { drawBezierCurve } from "./path.js";

/**
 * Draw a parsed path using pre-computed commands
 * @param {Object} p - p5.js instance
 * @param {Array} commands - Pre-parsed path commands
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 */
export function drawPath(p, commands, viewBox, scaleX, scaleY) {
  if (!commands || commands.length === 0) return;

  // Split commands into subpaths
  const subpaths = splitCommandsIntoSubpaths(commands);

  // Track position across all path segments
  let globalCurrentX = 0;
  let globalCurrentY = 0;

  // First path is always the outer path
  const outerPath = subpaths[0];
  if (outerPath) {
    p.beginShape();
    const outerResult = executePathCommands(
      p,
      outerPath,
      false,
      viewBox,
      scaleX,
      scaleY,
      globalCurrentX,
      globalCurrentY
    );
    globalCurrentX = outerResult.currentX;
    globalCurrentY = outerResult.currentY;

    // Draw all subsequent paths as contours (holes)
    for (let i = 1; i < subpaths.length; i++) {
      p.beginContour();
      const contourResult = executePathCommands(
        p,
        subpaths[i],
        true,
        viewBox,
        scaleX,
        scaleY,
        globalCurrentX,
        globalCurrentY
      );
      globalCurrentX = contourResult.currentX;
      globalCurrentY = contourResult.currentY;
      p.endContour();
    }

    // Check if the path ends with a close command
    const hasCloseCommand =
      commands[commands.length - 1]?.type === "Z" ||
      commands[commands.length - 1]?.type === "z";
    p.endShape(hasCloseCommand ? p.CLOSE : p.OPEN);
  }
}

/**
 * Split path commands into subpaths based on move commands
 * @param {Array} commands - Array of path commands
 * @returns {Array} Array of subpath command arrays
 */
function splitCommandsIntoSubpaths(commands) {
  const subpaths = [];
  let currentSubpath = [];

  commands.forEach((command) => {
    if (
      (command.type === "M" || command.type === "m") &&
      currentSubpath.length > 0
    ) {
      subpaths.push(currentSubpath);
      currentSubpath = [command];
    } else {
      currentSubpath.push(command);
    }

    if (command.type === "Z" || command.type === "z") {
      subpaths.push(currentSubpath);
      currentSubpath = [];
    }
  });

  if (currentSubpath.length > 0) {
    subpaths.push(currentSubpath);
  }

  return subpaths;
}

/**
 * Execute path commands for drawing
 * @param {Object} p - p5.js instance
 * @param {Array} commands - Array of path commands
 * @param {boolean} isContour - Whether this is a contour (hole)
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 * @param {number} initialX - Initial X position
 * @param {number} initialY - Initial Y position
 * @returns {Object} Final position {currentX, currentY}
 */
function executePathCommands(
  p,
  commands,
  isContour,
  viewBox,
  scaleX,
  scaleY,
  initialX = 0,
  initialY = 0
) {
  let currentX = initialX;
  let currentY = initialY;
  let firstX = initialX;
  let firstY = initialY;
  let controlX = 0;
  let controlY = 0;
  let lastCommand = "";

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];

    switch (cmd.type) {
      case "M": // Move To (absolute)
        currentX = cmd.x;
        currentY = cmd.y;
        firstX = currentX;
        firstY = currentY;
        const movePos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(movePos.x, movePos.y);
        break;

      case "m": // Move To (relative)
        currentX += cmd.x;
        currentY += cmd.y;
        firstX = currentX;
        firstY = currentY;
        const moveRelPos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(moveRelPos.x, moveRelPos.y);
        break;

      case "L": // Line To (absolute)
        currentX = cmd.x;
        currentY = cmd.y;
        const linePos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(linePos.x, linePos.y);
        break;

      case "l": // Line To (relative)
        currentX += cmd.x;
        currentY += cmd.y;
        const lineRelPos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(lineRelPos.x, lineRelPos.y);
        break;

      case "H": // Horizontal Line (absolute)
        currentX = cmd.x;
        const hPos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(hPos.x, hPos.y);
        break;

      case "h": // Horizontal Line (relative)
        currentX += cmd.x;
        const hRelPos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(hRelPos.x, hRelPos.y);
        break;

      case "V": // Vertical Line (absolute)
        currentY = cmd.y;
        const vPos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(vPos.x, vPos.y);
        break;

      case "v": // Vertical Line (relative)
        currentY += cmd.y;
        const vRelPos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(vRelPos.x, vRelPos.y);
        break;

      case "C": // Cubic Bezier (absolute)
        const c1 = transformCoord(cmd.x1, cmd.y1, viewBox, scaleX, scaleY);
        const c2 = transformCoord(cmd.x2, cmd.y2, viewBox, scaleX, scaleY);
        const cEnd = transformCoord(cmd.x, cmd.y, viewBox, scaleX, scaleY);
        if (p.bezierOrder) {
          p.bezierOrder(3);
          p.bezierVertex(c1.x, c1.y);
          p.bezierVertex(c2.x, c2.y);
          p.bezierVertex(cEnd.x, cEnd.y);
        } else {
          p.bezierVertex(c1.x, c1.y, c2.x, c2.y, cEnd.x, cEnd.y);
        }
        controlX = cmd.x2;
        controlY = cmd.y2;
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case "c": // Cubic Bezier (relative)
        const c1Rel = transformCoord(
          currentX + cmd.x1,
          currentY + cmd.y1,
          viewBox,
          scaleX,
          scaleY
        );
        const c2Rel = transformCoord(
          currentX + cmd.x2,
          currentY + cmd.y2,
          viewBox,
          scaleX,
          scaleY
        );
        const cEndRel = transformCoord(
          currentX + cmd.x,
          currentY + cmd.y,
          viewBox,
          scaleX,
          scaleY
        );

        if (p.bezierOrder) {
          p.bezierOrder(3);
          p.bezierVertex(c1Rel.x, c1Rel.y);
          p.bezierVertex(c2Rel.x, c2Rel.y);
          p.bezierVertex(cEndRel.x, cEndRel.y);
        } else {
          p.bezierVertex(
            c1Rel.x,
            c1Rel.y,
            c2Rel.x,
            c2Rel.y,
            cEndRel.x,
            cEndRel.y
          );
        }
        controlX = currentX + cmd.x2;
        controlY = currentY + cmd.y2;
        currentX += cmd.x;
        currentY += cmd.y;
        break;

      case "S": // Smooth Cubic Bezier (absolute)
        const sx1 =
          lastCommand === "C" ||
          lastCommand === "c" ||
          lastCommand === "S" ||
          lastCommand === "s"
            ? 2 * currentX - controlX
            : currentX;
        const sy1 =
          lastCommand === "C" ||
          lastCommand === "c" ||
          lastCommand === "S" ||
          lastCommand === "s"
            ? 2 * currentY - controlY
            : currentY;

        const s1 = transformCoord(sx1, sy1, viewBox, scaleX, scaleY);
        const s2 = transformCoord(cmd.x2, cmd.y2, viewBox, scaleX, scaleY);
        const sEnd = transformCoord(cmd.x, cmd.y, viewBox, scaleX, scaleY);
        if (p.bezierOrder) {
          p.bezierOrder(3);
          p.bezierVertex(s1.x, s1.y);
          p.bezierVertex(s2.x, s2.y);
          p.bezierVertex(sEnd.x, sEnd.y);
        } else {
          p.bezierVertex(s1.x, s1.y, s2.x, s2.y, sEnd.x, sEnd.y);
        }
        controlX = cmd.x2;
        controlY = cmd.y2;
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case "s": // Smooth Cubic Bezier (relative)
        const sx1Rel =
          lastCommand === "C" ||
          lastCommand === "c" ||
          lastCommand === "S" ||
          lastCommand === "s"
            ? 2 * currentX - controlX
            : currentX;
        const sy1Rel =
          lastCommand === "C" ||
          lastCommand === "c" ||
          lastCommand === "S" ||
          lastCommand === "s"
            ? 2 * currentY - controlY
            : currentY;

        const s1Rel = transformCoord(sx1Rel, sy1Rel, viewBox, scaleX, scaleY);
        const s2Rel = transformCoord(
          currentX + cmd.x2,
          currentY + cmd.y2,
          viewBox,
          scaleX,
          scaleY
        );
        const sEndRel = transformCoord(
          currentX + cmd.x,
          currentY + cmd.y,
          viewBox,
          scaleX,
          scaleY
        );
        if (p.bezierOrder) {
          p.bezierOrder(3);
          p.bezierVertex(s1Rel.x, s1Rel.y);
          p.bezierVertex(s2Rel.x, s2Rel.y);
          p.bezierVertex(sEndRel.x, sEndRel.y);
        } else {
          p.bezierVertex(
            s1Rel.x,
            s1Rel.y,
            s2Rel.x,
            s2Rel.y,
            sEndRel.x,
            sEndRel.y
          );
        }
        controlX = currentX + cmd.x2;
        controlY = currentY + cmd.y2;
        currentX += cmd.x;
        currentY += cmd.y;
        break;

      case "Q": // Quadratic Bezier (absolute)
        const q1 = transformCoord(cmd.x1, cmd.y1, viewBox, scaleX, scaleY);
        const qEnd = transformCoord(cmd.x, cmd.y, viewBox, scaleX, scaleY);
        if (p.bezierOrder) {
          p.bezierOrder(2);
          p.bezierVertex(q1.x, q1.y);
          p.bezierVertex(qEnd.x, qEnd.y);
        } else {
          p.bezierVertex(q1.x, q1.y, qEnd.x, qEnd.y);
        }
        controlX = cmd.x1;
        controlY = cmd.y1;
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case "q": // Quadratic Bezier (relative)
        const q1Rel = transformCoord(
          currentX + cmd.x1,
          currentY + cmd.y1,
          viewBox,
          scaleX,
          scaleY
        );
        const qEndRel = transformCoord(
          currentX + cmd.x,
          currentY + cmd.y,
          viewBox,
          scaleX,
          scaleY
        );
        if (p.bezierOrder) {
          p.bezierOrder(2);
          p.bezierVertex(q1Rel.x, q1Rel.y);
          p.bezierVertex(qEndRel.x, qEndRel.y);
        } else {
          p.bezierVertex(q1Rel.x, q1Rel.y, qEndRel.x, qEndRel.y);
        }
        controlX = currentX + cmd.x1;
        controlY = currentY + cmd.y1;
        currentX += cmd.x;
        currentY += cmd.y;
        break;

      case "T": // Smooth Quadratic Bezier (absolute)
        const tx1 =
          lastCommand === "Q" ||
          lastCommand === "q" ||
          lastCommand === "T" ||
          lastCommand === "t"
            ? 2 * currentX - controlX
            : currentX;
        const ty1 =
          lastCommand === "Q" ||
          lastCommand === "q" ||
          lastCommand === "T" ||
          lastCommand === "t"
            ? 2 * currentY - controlY
            : currentY;

        const t1 = transformCoord(tx1, ty1, viewBox, scaleX, scaleY);
        const tEnd = transformCoord(cmd.x, cmd.y, viewBox, scaleX, scaleY);
        if (p.bezierOrder) {
          p.bezierOrder(2);
          p.bezierVertex(t1.x, t1.y);
          p.bezierVertex(tEnd.x, tEnd.y);
        } else {
          p.bezierVertex(t1.x, t1.y, tEnd.x, tEnd.y);
        }
        controlX = tx1;
        controlY = ty1;
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case "t": // Smooth Quadratic Bezier (relative)
        const tx1Rel =
          lastCommand === "Q" ||
          lastCommand === "q" ||
          lastCommand === "T" ||
          lastCommand === "t"
            ? 2 * currentX - controlX
            : currentX;
        const ty1Rel =
          lastCommand === "Q" ||
          lastCommand === "q" ||
          lastCommand === "T" ||
          lastCommand === "t"
            ? 2 * currentY - controlY
            : currentY;

        const t1Rel = transformCoord(tx1Rel, ty1Rel, viewBox, scaleX, scaleY);
        const tEndRel = transformCoord(
          currentX + cmd.x,
          currentY + cmd.y,
          viewBox,
          scaleX,
          scaleY
        );
        if (p.bezierOrder) {
          p.bezierOrder(2);
          p.bezierVertex(t1Rel.x, t1Rel.y);
          p.bezierVertex(tEndRel.x, tEndRel.y);
        } else {
          p.bezierVertex(t1Rel.x, t1Rel.y, tEndRel.x, tEndRel.y);
        }
        controlX = tx1Rel;
        controlY = ty1Rel;
        currentX += cmd.x;
        currentY += cmd.y;
        break;

      case "A": // Elliptical Arc (absolute)
        const bezierCurves = ellipticalArcToBezier(
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
        bezierCurves.forEach((bezier) =>
          drawBezierCurve(p, bezier, viewBox, scaleX, scaleY)
        );
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case "a": // Elliptical Arc (relative)
        const endX = currentX + cmd.x;
        const endY = currentY + cmd.y;
        const bezierCurvesRel = ellipticalArcToBezier(
          currentX,
          currentY,
          cmd.rx,
          cmd.ry,
          cmd.xAxisRotation,
          cmd.largeArcFlag,
          cmd.sweepFlag,
          endX,
          endY
        );
        bezierCurvesRel.forEach((bezier) =>
          drawBezierCurve(p, bezier, viewBox, scaleX, scaleY)
        );
        currentX = endX;
        currentY = endY;
        break;

      case "Z": // Close Path
      case "z":
        if (!isContour) {
          const closePos = transformCoord(
            firstX,
            firstY,
            viewBox,
            scaleX,
            scaleY
          );
          p.vertex(closePos.x, closePos.y);
        }
        currentX = firstX;
        currentY = firstY;
        break;
    }

    lastCommand = cmd.type;
  }

  // For contours, ensure we connect back to starting point
  if (
    isContour &&
    commands.length > 0 &&
    commands[commands.length - 1].type !== "Z" &&
    commands[commands.length - 1].type !== "z"
  ) {
    const closePos = transformCoord(firstX, firstY, viewBox, scaleX, scaleY);
    p.vertex(closePos.x, closePos.y);
  }

  return { currentX, currentY };
}

/**
 * Draw a parsed rectangle
 * @param {Object} p - p5.js instance
 * @param {Object} command - Rectangle command object
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 */
export function drawRect(p, command, viewBox, scaleX, scaleY) {
  const pos = transformCoord(command.x, command.y, viewBox, scaleX, scaleY);
  const w = command.width * scaleX;
  const h = command.height * scaleY;
  p.rect(pos.x, pos.y, w, h);
}

/**
 * Draw a parsed circle
 * @param {Object} p - p5.js instance
 * @param {Object} command - Circle command object
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 */
export function drawCircle(p, command, viewBox, scaleX, scaleY) {
  const center = transformCoord(
    command.cx,
    command.cy,
    viewBox,
    scaleX,
    scaleY
  );
  const radiusX = command.r * scaleX;
  const radiusY = command.r * scaleY;
  p.ellipse(center.x, center.y, radiusX * 2, radiusY * 2);
}

/**
 * Draw a parsed ellipse
 * @param {Object} p - p5.js instance
 * @param {Object} command - Ellipse command object
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 */
export function drawEllipse(p, command, viewBox, scaleX, scaleY) {
  const center = transformCoord(
    command.cx,
    command.cy,
    viewBox,
    scaleX,
    scaleY
  );
  const radiusX = command.rx * scaleX;
  const radiusY = command.ry * scaleY;
  p.ellipse(center.x, center.y, radiusX * 2, radiusY * 2);
}

/**
 * Draw a parsed line
 * @param {Object} p - p5.js instance
 * @param {Object} command - Line command object
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 */
export function drawLine(p, command, viewBox, scaleX, scaleY) {
  const start = transformCoord(command.x1, command.y1, viewBox, scaleX, scaleY);
  const end = transformCoord(command.x2, command.y2, viewBox, scaleX, scaleY);
  p.line(start.x, start.y, end.x, end.y);
}

/**
 * Draw a parsed polyline
 * @param {Object} p - p5.js instance
 * @param {Array} commands - Array of point commands
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 */
export function drawPolyline(p, commands, viewBox, scaleX, scaleY) {
  if (!commands || commands.length === 0) return;

  p.beginShape();
  commands.forEach((command) => {
    const transformedPoint = transformCoord(
      command.x,
      command.y,
      viewBox,
      scaleX,
      scaleY
    );
    p.vertex(transformedPoint.x, transformedPoint.y);
  });
  p.endShape();
}

/**
 * Draw a parsed polygon
 * @param {Object} p - p5.js instance
 * @param {Array} commands - Array of point commands
 * @param {Object} viewBox - SVG viewBox
 * @param {number} scaleX - X scale factor
 * @param {number} scaleY - Y scale factor
 */
export function drawPolygon(p, commands, viewBox, scaleX, scaleY) {
  if (!commands || commands.length === 0) return;

  p.beginShape();
  commands.forEach((command) => {
    const transformedPoint = transformCoord(
      command.x,
      command.y,
      viewBox,
      scaleX,
      scaleY
    );
    p.vertex(transformedPoint.x, transformedPoint.y);
  });
  p.endShape(p.CLOSE);
}
