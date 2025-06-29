/**
 * p5-svg-loader.js
 * A P5.js add-on library for loading and manipulating SVG files.
 * 
 * @version 0.0.1
 * @author Olivier Estévez
 * @license MIT
 */

import { parse } from "svg-parser";

(function() {
  'use strict';

  // P5.js 2.0 addon definition
  const p5SvgLoaderAddon = function (p5, fn, lifecycles) {
    
    p5.prototype.SVG = class {
      constructor(svgString) {
        this.raw = svgString.toString();
        this.parsed = parse(svgString);
        this.svg = this.parsed.children[0];
        this.width = parseFloat(this.svg.properties.width) || 100;
        this.height = parseFloat(this.svg.properties.height) || 100;
        this.viewBox = this._parseViewBox(this.svg.properties.viewBox);
        
        this.points = []
        this.children = []
      }

      _parseViewBox(viewBox) {
        if (!viewBox) return { x: 0, y: 0, width: this.width, height: this.height };

        const values = viewBox.split(/\s+/).map(parseFloat);
        return {
          x: values[0] || 0,
          y: values[1] || 0,
          width: values[2] || this.width,
          height: values[3] || this.height,
        };
      }

      getChild(name) { /* ... */ }

      points(name) { /* ... */ }
    };

    // Main SVG loader function
    fn.loadSVG = async function(filename, callback) {
      try {
        const response = await fetch(filename);
        const svgContent = await response.text();
        const result = new this.SVG(svgContent);
        if (callback) {
          callback(result);
        }
        return result;
      } catch (error) {
        throw error;
      }
    };


    fn.drawSVG = function (svgData, x, y, width = svgData.width, height = svgData.height) {
      const scaleX = width / svgData.viewBox.width;
      const scaleY = height / svgData.viewBox.height;

      this.push();
      this.translate(x, y);

      drawNode(this, svgData.svg, svgData.viewBox, scaleX, scaleY);

      this.pop();
    };

    fn.drawSVGDebug = function (svgData, x, y, width, height) {
      // ...
    };

    // Helper functions
    function transformCoord(x, y, viewBox, scaleX, scaleY) {
      return {
        x: (x - viewBox.x) * scaleX,
        y: (y - viewBox.y) * scaleY
      };
    }

    function drawNode(p, node, viewBox, scaleX, scaleY) {
      if (!node || !node.children) return;
      
      // Process this node if it's a shape
      if (node.tagName && node.tagName !== 'svg') {
        drawShape(p, node, viewBox, scaleX, scaleY);
      }

      // Process children recursively
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => drawNode(p, child, viewBox, scaleX, scaleY));
      }
    };

    function drawShape(p, node, viewBox, scaleX, scaleY) {
      const props = node.properties || {};
      const children = node.children || {};

      console.log('drawShape', node);

      // Set styles
      applyStyles(p, props);

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

    function drawRect(p, props, viewBox, scaleX, scaleY) {
      const x = parseFloat(props.x) || 0;
      const y = parseFloat(props.y) || 0;
      const width = parseFloat(props.width) || 0;
      const height = parseFloat(props.height) || 0;

      // Transform coordinates
      const pos = transformCoord(x, y, viewBox, scaleX, scaleY);
      const w = width * scaleX;
      const h = height * scaleY;

      // Apply styles
      applyStyles(p, props);

      // Draw the rectangle
      p.rect(pos.x, pos.y, w, h);
    }

    function drawCircle(p, props, viewBox, scaleX, scaleY) {
      const cx = parseFloat(props.cx) || 0;
      const cy = parseFloat(props.cy) || 0;
      const r = parseFloat(props.r) || 0;

      // Transform coordinates
      const center = transformCoord(cx, cy, viewBox, scaleX, scaleY);
      const radiusX = r * scaleX;
      const radiusY = r * scaleY;

      // Apply styles
      applyStyles(p, props);

      // Draw the circle
      p.ellipse(center.x, center.y, radiusX * 2, radiusY * 2);
    }

    function drawEllipse(p, props, viewBox, scaleX, scaleY) {
      const cx = parseFloat(props.cx) || 0;
      const cy = parseFloat(props.cy) || 0;
      const rx = parseFloat(props.rx) || 0;
      const ry = parseFloat(props.ry) || 0;

      // Transform coordinates
      const center = transformCoord(cx, cy, viewBox, scaleX, scaleY);
      const radiusX = rx * scaleX;
      const radiusY = ry * scaleY;

      // Apply styles
      applyStyles(p, props);

      // Draw the ellipse
      p.ellipse(center.x, center.y, radiusX * 2, radiusY * 2);
    }

    function drawLine(p, props, viewBox, scaleX, scaleY) {
      const x1 = parseFloat(props.x1) || 0;
      const y1 = parseFloat(props.y1) || 0;
      const x2 = parseFloat(props.x2) || 0;
      const y2 = parseFloat(props.y2) || 0;

      // Transform coordinates
      const start = transformCoord(x1, y1, viewBox, scaleX, scaleY);
      const end = transformCoord(x2, y2, viewBox, scaleX, scaleY);

      // Apply styles
      applyStyles(p, props);

      // Draw the line
      p.line(start.x, start.y, end.x, end.y);
    }

    function drawPolyline(p, props, viewBox, scaleX, scaleY) {
      if (!props.points) return;

      const points = parsePoints(props.points);

      // Apply styles
      applyStyles(p, props);

      p.beginShape();
      points.forEach((point) => {
        const transformedPoint = transformCoord(point.x, point.y, viewBox, scaleX, scaleY);
        p.vertex(transformedPoint.x, transformedPoint.y);
      });
      p.endShape();
    }

    function drawPolygon(p, props, viewBox, scaleX, scaleY) {
      if (!props.points) return;
      const points = parsePoints(props.points);

      // Apply styles
      applyStyles(p, props);

      p.beginShape();
      points.forEach((point) => {
        const transformedPoint = transformCoord(point.x, point.y, viewBox, scaleX, scaleY);
        p.vertex(transformedPoint.x, transformedPoint.y);
      });
      p.endShape(p.CLOSE);
    }

    function drawText(p, props, children, viewBox, scaleX, scaleY) {
      const x = parseFloat(props.x) || 0;
      const y = parseFloat(props.y) || 0;
      const textContent = children ? children[0].value : '';
      
      if (!textContent) return;

      // Transform coordinates
      const pos = transformCoord(x, y, viewBox, scaleX, scaleY);
      
      // Apply styles
      applyStyles(p, props);

      // Use the actual scale values to follow distortion aspect ratio
      p.push();
      p.translate(pos.x, pos.y);
      p.scale(scaleX, scaleY);
      // Draw text at origin since we've already translated
      p.text(textContent, 0, 0);
      
      p.pop();
    }

    function drawPath(p, d, viewBox, scaleX, scaleY) {
      if (!d) return;

      // Parse the SVG path commands
      const pathSegments = splitPathIntoSubpaths(d);

      // First path is always the outer path
      const outerPath = pathSegments[0];

      p.beginShape();
      drawPathCommands(p, outerPath, false, viewBox, scaleX, scaleY);

      // Draw all subsequent paths as contours (holes)
      for (let i = 1; i < pathSegments.length; i++) {
        p.beginContour();
        drawPathCommands(p, pathSegments[i], true, viewBox, scaleX, scaleY);
        p.endContour();
      }

      // Check if the path ends with a close command (Z or z)
      const hasCloseCommand = d.trim().toLowerCase().endsWith('z');
      p.endShape(hasCloseCommand ? p.CLOSE : p.OPEN);
    }

    function splitPathIntoSubpaths(d) {
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
    
    function drawPathCommands(p, pathString, isContour, viewBox, scaleX, scaleY) {
    // Parse the commands for this path segment
    const commands = parsePath(pathString);

    let currentX = 0;
    let currentY = 0;
    let firstX = 0;
    let firstY = 0;
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
          const movePos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(movePos.x, movePos.y);
          break;

        case "m": // Move To (relative)
          currentX += cmd.x;
          currentY += cmd.y;
          firstX = currentX;
          firstY = currentY;
          const moveRelPos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(moveRelPos.x, moveRelPos.y);
          break;

        case "L": // Line To (absolute)
          currentX = cmd.x;
          currentY = cmd.y;
          const linePos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(linePos.x, linePos.y);
          break;

        case "l": // Line To (relative)
          currentX += cmd.x;
          currentY += cmd.y;
          const lineRelPos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(lineRelPos.x, lineRelPos.y);
          break;

        case "H": // Horizontal Line (absolute)
          currentX = cmd.x;
          const hPos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(hPos.x, hPos.y);
          break;

        case "h": // Horizontal Line (relative)
          currentX += cmd.x;
          const hRelPos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(hRelPos.x, hRelPos.y);
          break;

        case "V": // Vertical Line (absolute)
          currentY = cmd.y;
          const vPos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(vPos.x, vPos.y);
          break;

        case "v": // Vertical Line (relative)
          currentY += cmd.y;
          const vRelPos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(vRelPos.x, vRelPos.y);
          break;

        case "C": // Cubic Bezier (absolute)
          const c1 = transformCoord(cmd.x1, cmd.y1, viewBox, scaleX, scaleY);
          const c2 = transformCoord(cmd.x2, cmd.y2, viewBox, scaleX, scaleY);
          const cEnd = transformCoord(cmd.x, cmd.y, viewBox, scaleX, scaleY);
          p.bezierVertex(c1.x, c1.y, c2.x, c2.y, cEnd.x, cEnd.y);
          controlX = cmd.x2;
          controlY = cmd.y2;
          currentX = cmd.x;
          currentY = cmd.y;
          break;

        case "c": // Cubic Bezier (relative)
          const c1Rel = transformCoord(currentX + cmd.x1, currentY + cmd.y1, viewBox, scaleX, scaleY);
          const c2Rel = transformCoord(currentX + cmd.x2, currentY + cmd.y2, viewBox, scaleX, scaleY);
          const cEndRel = transformCoord(currentX + cmd.x, currentY + cmd.y, viewBox, scaleX, scaleY);
          p.bezierVertex(c1Rel.x, c1Rel.y, c2Rel.x, c2Rel.y, cEndRel.x, cEndRel.y);
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
          p.bezierVertex(s1.x, s1.y, s2.x, s2.y, sEnd.x, sEnd.y);
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
          const s2Rel = transformCoord(currentX + cmd.x2, currentY + cmd.y2, viewBox, scaleX, scaleY);
          const sEndRel = transformCoord(currentX + cmd.x, currentY + cmd.y, viewBox, scaleX, scaleY);
          p.bezierVertex(s1Rel.x, s1Rel.y, s2Rel.x, s2Rel.y, sEndRel.x, sEndRel.y);
          controlX = currentX + cmd.x2;
          controlY = currentY + cmd.y2;
          currentX += cmd.x;
          currentY += cmd.y;
          break;

        case "Q": // Quadratic Bezier (absolute)
          p.bezierOrder(2);
          const q1 = transformCoord(cmd.x1, cmd.y1, viewBox, scaleX, scaleY);
          const qEnd = transformCoord(cmd.x, cmd.y, viewBox, scaleX, scaleY);
          p.bezierVertex(q1.x, q1.y);
          p.bezierVertex(qEnd.x, qEnd.y);
          controlX = cmd.x1;
          controlY = cmd.y1;
          currentX = cmd.x;
          currentY = cmd.y;
          break;

        case "q": // Quadratic Bezier (relative)
          p.bezierOrder(2);
          const q1Rel = transformCoord(currentX + cmd.x1, currentY + cmd.y1, viewBox, scaleX, scaleY);
          const qEndRel = transformCoord(currentX + cmd.x, currentY + cmd.y, viewBox, scaleX, scaleY);
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

          p.bezierOrder(2);
          const t1 = transformCoord(tx1, ty1, viewBox, scaleX, scaleY);
          const tEnd = transformCoord(cmd.x, cmd.y, viewBox, scaleX, scaleY);
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

          p.bezierOrder(2);
          const t1Rel = transformCoord(tx1Rel, ty1Rel, viewBox, scaleX, scaleY);
          const tEndRel = transformCoord(currentX + cmd.x, currentY + cmd.y, viewBox, scaleX, scaleY);
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
          const aPos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(aPos.x, aPos.y);
          break;

        case "a": // Elliptical Arc (relative)
          // Simplified arc implementation
          currentX += cmd.x;
          currentY += cmd.y;
          const aRelPos = transformCoord(currentX, currentY, viewBox, scaleX, scaleY);
          p.vertex(aRelPos.x, aRelPos.y);
          break;

        case "Z": // Close Path
        case "z":
          // For contours, we don't need to explicitly close the path
          if (!isContour) {
            const closePos = transformCoord(firstX, firstY, viewBox, scaleX, scaleY);
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
      p.vertex(firstX, firstY);
    }
  }

  function parsePath(d) {
    if (!d) return [];

    // Tokenize the path data
    const tokens = d.match(/[a-df-z][^a-df-z]*/gi) || [];
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

    function applyStyles(p, props) {
      p.noStroke();
      p.noFill();
      p.textSize(10);
      p.textAlign(p.LEFT);
      p.textFont("Arial");
      p.textStyle(p.NORMAL);
      p.drawingContext.globalAlpha = 1;

    // Set fill
    if (props.fill === "none") {
      p.noFill();
    } else if (props.fill) {
      p.fill(props.fill);
    }

    // Set stroke
    if (props.stroke === "none") {
      p.noStroke();
    } else if (props.stroke) {
      p.stroke(props.stroke);
    }

    // Set stroke width
    if (props["stroke-width"]) {
      p.strokeWeight(parseFloat(props["stroke-width"]));
    }

    // Text-specific properties
    if (props["font-size"]) {
      p.textSize(parseFloat(props["font-size"]));
    }
    
    if (props["font-family"]) {
      p.textFont(props["font-family"]);
    }
    
    if (props["text-anchor"]) {
      // Handle text alignment
      switch (props["text-anchor"]) {
        case "middle":
          p.textAlign(p.CENTER);
          break;
        case "end":
          p.textAlign(p.RIGHT);
          break;
        default: // "start"
          p.textAlign(p.LEFT);
          break;
      }
    }
      
    // Set opacity
    if (props.opacity !== undefined) {
      const opacity = parseFloat(props.opacity);
      if (opacity >= 0 && opacity <= 1) {
        p.drawingContext.globalAlpha = opacity;
      }
    }

    // More style properties can be added here (opacity, etc.)
    }
      
    function parsePoints(pointsStr) {
    return pointsStr
      .trim()
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .split(" ")
      .reduce((acc, val, i, arr) => {
        if (i % 2 === 0) {
          acc.push({ x: parseFloat(val), y: parseFloat(arr[i + 1]) || 0 });
        }
        return acc;
      }, []);
  }

    // Lifecycle hooks
    lifecycles.presetup = function() {
      console.log('⚙️ p5-svg-loader initialized');
    };
  };

  // Register the addon with P5.js 2.0
  if (typeof p5 !== 'undefined' && p5.registerAddon) {
    p5.registerAddon(p5SvgLoaderAddon);
  } else {
    // Fallback for P5.js 1.x compatibility
    console.warn('p5-svg-loader: P5.js 2.0 addon system not available, falling back to 1.x compatibility');
    
    // Legacy P5.js 1.x support
    p5.prototype.loadSVG = function(filename, callback) {
      console.log(`Loading SVG file: ${filename}`);
      
      const result = {
        data: null,
        error: null,
        filename: filename
      };

      // Simulate async loading
      setTimeout(() => {
        result.data = `<svg>Sample SVG content for ${filename}</svg>`;
        if (callback) {
          callback(result);
        }
        this._decrementPreload();
      }, 100);

      return result;
    };

    // Register for preload functionality in P5.js 1.x
    if (p5.prototype.registerPreloadMethod) {
      p5.prototype.registerPreloadMethod('loadSVG', p5.prototype);
    }

    p5.prototype.drawSVG = function(svgData, x, y, width, height) {
      this.fill(255, 0, 0);
      this.noStroke();
      this.rect(x, y, width, height);
    };

    // Legacy lifecycle hooks
    if (p5.prototype.registerMethod) {
      p5.prototype.svgLoaderInit = function() {
        console.log('p5-svg-loader initialized (legacy mode)');
      };
      p5.prototype.registerMethod('init', p5.prototype.svgLoaderInit);
    }
  }

  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = p5;
  }
})();