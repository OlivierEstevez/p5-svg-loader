/**
 * Path parsing and drawing functions for SVG paths
 */

import { transformCoord } from "../utils/transform.js";

export function drawPath(p, d, viewBox, scaleX, scaleY) {
  if (!d) return;

  // Parse the SVG path commands
  const pathSegments = splitPathIntoSubpaths(d);

  // Track position across all path segments
  let globalCurrentX = 0;
  let globalCurrentY = 0;

  // First path is always the outer path
  const outerPath = pathSegments[0];

  p.beginShape();
  const outerResult = drawPathCommands(
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
  for (let i = 1; i < pathSegments.length; i++) {
    p.beginContour();
    const contourResult = drawPathCommands(
      p,
      pathSegments[i],
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

  // Check if the path ends with a close command (Z or z)
  const hasCloseCommand = d.trim().toLowerCase().endsWith("z");
  p.endShape(hasCloseCommand ? p.CLOSE : p.OPEN);
}

export function splitPathIntoSubpaths(d) {
  // Split path by move commands to separate subpaths
  const tokens = d.match(/[a-df-z][^a-df-z]*/gi) || [];
  const subpaths = [];
  let currentPath = "";

  tokens.forEach((token) => {
    const type = token[0];

    // Start a new subpath when we encounter M or m
    if ((type === "M" || type === "m") && currentPath !== "") {
      subpaths.push(currentPath);
      currentPath = token;
    } else {
      currentPath += token;
    }

    // If we encounter a close path command, complete the current subpath
    if (type === "Z" || type === "z") {
      subpaths.push(currentPath);
      currentPath = "";
    }
  });

  // Add any remaining path
  if (currentPath !== "") {
    subpaths.push(currentPath);
  }

  return subpaths;
}

export function drawPathCommands(
  p,
  pathString,
  isContour,
  viewBox,
  scaleX,
  scaleY,
  initialX = 0,
  initialY = 0
) {
  // Parse the commands for this path segment
  const commands = parsePath(pathString);

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
        p.bezierOrder(3);
        p.bezierVertex(c1.x, c1.y);
        p.bezierVertex(c2.x, c2.y);
        p.bezierVertex(cEnd.x, cEnd.y);
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

        p.bezierOrder(3);
        p.bezierVertex(c1Rel.x, c1Rel.y);
        p.bezierVertex(c2Rel.x, c2Rel.y);
        p.bezierVertex(cEndRel.x, cEndRel.y);
        controlX = currentX + cmd.x2;
        controlY = currentY + cmd.y2;
        currentX += cmd.x;
        currentY += cmd.y;
        break;

      case "S": // Smooth Cubic Bezier (absolute)
        // Reflect previous control point
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
        p.bezierOrder(3);
        p.bezierVertex(s1.x, s1.y);
        p.bezierVertex(s2.x, s2.y);
        p.bezierVertex(sEnd.x, sEnd.y);
        controlX = cmd.x2;
        controlY = cmd.y2;
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case "s": // Smooth Cubic Bezier (relative)
        // Reflect previous control point
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
        p.bezierOrder(3);
        p.bezierVertex(s1Rel.x, s1Rel.y);
        p.bezierVertex(s2Rel.x, s2Rel.y);
        p.bezierVertex(sEndRel.x, sEndRel.y);
        controlX = currentX + cmd.x2;
        controlY = currentY + cmd.y2;
        currentX += cmd.x;
        currentY += cmd.y;
        break;

      case "Q": // Quadratic Bezier (absolute)
        const q1 = transformCoord(cmd.x1, cmd.y1, viewBox, scaleX, scaleY);
        const qEnd = transformCoord(cmd.x, cmd.y, viewBox, scaleX, scaleY);
        p.bezierOrder(2);
        p.bezierVertex(q1.x, q1.y);
        p.bezierVertex(qEnd.x, qEnd.y);
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
        p.bezierOrder(2);
        p.bezierVertex(q1Rel.x, q1Rel.y);
        p.bezierVertex(qEndRel.x, qEndRel.y);
        controlX = currentX + cmd.x1;
        controlY = currentY + cmd.y1;
        currentX += cmd.x;
        currentY += cmd.y;
        break;

      case "T": // Smooth Quadratic Bezier (absolute)
        // Reflect previous control point
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
        p.bezierOrder(2);
        p.bezierVertex(t1.x, t1.y);
        p.bezierVertex(tEnd.x, tEnd.y);
        controlX = tx1;
        controlY = ty1;
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case "t": // Smooth Quadratic Bezier (relative)
        // Reflect previous control point
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
        p.bezierOrder(2);
        p.bezierVertex(t1Rel.x, t1Rel.y);
        p.bezierVertex(tEndRel.x, tEndRel.y);
        controlX = tx1Rel;
        controlY = ty1Rel;
        currentX += cmd.x;
        currentY += cmd.y;
        break;

      case "A": // Elliptical Arc (absolute)
        // P5.js doesn't have a direct arc function that matches SVG's arc command
        // This is a simplified implementation
        currentX = cmd.x;
        currentY = cmd.y;
        const aPos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(aPos.x, aPos.y);
        break;

      case "a": // Elliptical Arc (relative)
        // Simplified arc implementation
        currentX += cmd.x;
        currentY += cmd.y;
        const aRelPos = transformCoord(
          currentX,
          currentY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(aRelPos.x, aRelPos.y);
        break;

      case "Z": // Close Path
      case "z":
        // For contours, we don't need to explicitly close the path
        if (!isContour) {
          const closePos = transformCoord(
            firstX,
            firstY,
            viewBox,
            scaleX,
            scaleY
          );
          p.vertex(closePos.x, closePos.y); // Connect back to the first point
        }
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

  // Return the final position for the next path segment
  return {
    currentX: currentX,
    currentY: currentY,
  };
}

export function parsePath(d) {
  if (!d) return [];

  // Tokenize the path data
  const tokens = d.match(/[a-z][^a-z]*/gi) || [];
  const commands = [];

  // Keep track of current position to convert H and V commands
  let currentX = 0;
  let currentY = 0;

  tokens.forEach((token) => {
    const type = token[0];
    const args = token
      .slice(1)
      .trim()
      .replace(/,/g, " ")
      // Handle cases like "3.43.928" -> "3.43 .928"
      .replace(/(\d+\.\d+)(\.\d+)/g, "$1 $2")
      // Handle cases like "1.234.56.78" (multiple decimals)
      .replace(/(\d+\.\d+)(\.\d+)/g, "$1 $2") // Run twice for multiple occurrences
      // Base number separation
      .replace(/([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)([+-])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .split(" ")
      .filter((arg) => arg !== "")
      .map(parseFloat);

    switch (type) {
      case "M": // Move To (absolute)
        for (let i = 0; i < args.length; i += 2) {
          if (i === 0) {
            currentX = args[i];
            currentY = args[i + 1];
            commands.push({
              type,
              x: currentX,
              y: currentY,
            });
          } else {
            // Subsequent coordinate pairs are treated as implicit Line commands
            currentX = args[i];
            currentY = args[i + 1];
            commands.push({
              type: "L",
              x: currentX,
              y: currentY,
            });
          }
        }
        break;

      case "m": // Move To (relative)
        for (let i = 0; i < args.length; i += 2) {
          if (i === 0) {
            currentX += args[i];
            currentY += args[i + 1];
            commands.push({
              type,
              x: args[i],
              y: args[i + 1],
            });
          } else {
            // Subsequent coordinate pairs are treated as implicit Line commands
            const relX = args[i];
            const relY = args[i + 1];
            currentX += relX;
            currentY += relY;
            commands.push({
              type: "l",
              x: relX,
              y: relY,
            });
          }
        }
        break;

      case "L": // Line To (absolute)
        for (let i = 0; i < args.length; i += 2) {
          currentX = args[i];
          currentY = args[i + 1];
          commands.push({
            type,
            x: currentX,
            y: currentY,
          });
        }
        break;

      case "l": // Line To (relative)
        for (let i = 0; i < args.length; i += 2) {
          const relX = args[i];
          const relY = args[i + 1];
          currentX += relX;
          currentY += relY;
          commands.push({
            type,
            x: relX,
            y: relY,
          });
        }
        break;

      case "H": // Horizontal Line (absolute)
        // Convert H to L - use current Y with new X
        args.forEach((arg) => {
          const newX = arg;
          commands.push({
            type: "L", // Convert to absolute line
            x: newX,
            y: currentY,
          });
          currentX = newX;
        });
        break;

      case "h": // Horizontal Line (relative)
        // Convert h to l - use 0 for Y with relative X
        args.forEach((arg) => {
          const relX = arg;
          currentX += relX;
          commands.push({
            type: "l", // Convert to relative line
            x: relX,
            y: 0,
          });
        });
        break;

      case "V": // Vertical Line (absolute)
        // Convert V to L - use current X with new Y
        args.forEach((arg) => {
          const newY = arg;
          commands.push({
            type: "L", // Convert to absolute line
            x: currentX,
            y: newY,
          });
          currentY = newY;
        });
        break;

      case "v": // Vertical Line (relative)
        // Convert v to l - use 0 for X with relative Y
        args.forEach((arg) => {
          const relY = arg;
          currentY += relY;
          commands.push({
            type: "l", // Convert to relative line
            x: 0,
            y: relY,
          });
        });
        break;

      case "C": // Cubic Bezier (absolute)
        for (let i = 0; i < args.length; i += 6) {
          currentX = args[i + 4];
          currentY = args[i + 5];
          commands.push({
            type,
            x1: args[i],
            y1: args[i + 1],
            x2: args[i + 2],
            y2: args[i + 3],
            x: currentX,
            y: currentY,
          });
        }
        break;

      case "c": // Cubic Bezier (relative)
        for (let i = 0; i < args.length; i += 6) {
          const relX = args[i + 4];
          const relY = args[i + 5];
          currentX += relX;
          currentY += relY;
          commands.push({
            type,
            x1: args[i],
            y1: args[i + 1],
            x2: args[i + 2],
            y2: args[i + 3],
            x: relX,
            y: relY,
          });
        }
        break;

      case "S": // Smooth Cubic Bezier (absolute)
        for (let i = 0; i < args.length; i += 4) {
          currentX = args[i + 2];
          currentY = args[i + 3];
          commands.push({
            type,
            x2: args[i],
            y2: args[i + 1],
            x: currentX,
            y: currentY,
          });
        }
        break;

      case "s": // Smooth Cubic Bezier (relative)
        for (let i = 0; i < args.length; i += 4) {
          const relX = args[i + 2];
          const relY = args[i + 3];
          currentX += relX;
          currentY += relY;
          commands.push({
            type,
            x2: args[i],
            y2: args[i + 1],
            x: relX,
            y: relY,
          });
        }
        break;

      case "Q": // Quadratic Bezier (absolute)
        for (let i = 0; i < args.length; i += 4) {
          currentX = args[i + 2];
          currentY = args[i + 3];
          commands.push({
            type,
            x1: args[i],
            y1: args[i + 1],
            x: currentX,
            y: currentY,
          });
        }
        break;

      case "q": // Quadratic Bezier (relative)
        for (let i = 0; i < args.length; i += 4) {
          const relX = args[i + 2];
          const relY = args[i + 3];
          currentX += relX;
          currentY += relY;
          commands.push({
            type,
            x1: args[i],
            y1: args[i + 1],
            x: relX,
            y: relY,
          });
        }
        break;

      case "T": // Smooth Quadratic Bezier (absolute)
        for (let i = 0; i < args.length; i += 2) {
          currentX = args[i];
          currentY = args[i + 1];
          commands.push({
            type,
            x: currentX,
            y: currentY,
          });
        }
        break;

      case "t": // Smooth Quadratic Bezier (relative)
        for (let i = 0; i < args.length; i += 2) {
          const relX = args[i];
          const relY = args[i + 1];
          currentX += relX;
          currentY += relY;
          commands.push({
            type,
            x: relX,
            y: relY,
          });
        }
        break;

      case "A": // Elliptical Arc (absolute)
        for (let i = 0; i < args.length; i += 7) {
          currentX = args[i + 5];
          currentY = args[i + 6];
          commands.push({
            type,
            rx: args[i],
            ry: args[i + 1],
            xAxisRotation: args[i + 2],
            largeArcFlag: args[i + 3],
            sweepFlag: args[i + 4],
            x: currentX,
            y: currentY,
          });
        }
        break;

      case "a": // Elliptical Arc (relative)
        for (let i = 0; i < args.length; i += 7) {
          const relX = args[i + 5];
          const relY = args[i + 6];
          currentX += relX;
          currentY += relY;
          commands.push({
            type,
            rx: args[i],
            ry: args[i + 1],
            xAxisRotation: args[i + 2],
            largeArcFlag: args[i + 3],
            sweepFlag: args[i + 4],
            x: relX,
            y: relY,
          });
        }
        break;

      case "Z": // Close Path
      case "z":
        commands.push({ type });
        break;
    }
  });

  return commands;
}
