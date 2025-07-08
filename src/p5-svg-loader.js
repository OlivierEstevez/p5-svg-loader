/**
 * p5-svg-loader.js
 * A P5.js add-on library for loading and manipulating SVG files.
 *
 * @version 0.0.1
 * @author Olivier Estévez
 * @license MIT
 */

import { parse } from "svg-parser";

(function () {
  "use strict";

  // P5.js 2.0 addon definition
  const p5SvgLoaderAddon = function (p5, fn, lifecycles) {
    p5.prototype.SVG = class {
      constructor(svgString) {
        // this.raw = svgString.toString();
        const parsed = parse(svgString);
        const svg = parsed.children[0];

        this.width = parseFloat(svg.properties.width) || 100;
        this.height = parseFloat(svg.properties.height) || 100;
        this.viewBox = this._parseViewBox(svg.properties.viewBox);

        //this.points = [];
        this.children = parsed.children[0].children;

        // Add reference to parent SVG in each child recursively
        this._addParentReference(this.children, this);
      }

      _parseViewBox(viewBox) {
        if (!viewBox)
          return { x: 0, y: 0, width: this.width, height: this.height };

        const values = viewBox.split(/\s+/).map(parseFloat);
        return {
          x: values[0] || 0,
          y: values[1] || 0,
          width: values[2] || this.width,
          height: values[3] || this.height,
        };
      }

      points(name) {
        /* ... */
      }

      _addParentReference(children, parentSVG) {
        children.forEach((child) => {
          child._parentSVG = parentSVG;
          if (child.children && child.children.length > 0) {
            this._addParentReference(child.children, parentSVG);
          }
        });
      }
    };

    // Main SVG loader function
    fn.loadSVG = async function (filename, callback) {
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

    fn.drawSVG = function (
      svgData,
      x,
      y,
      width = svgData.width,
      height = svgData.height,
      options = {
        ignoreStyles: false,
      }
    ) {
      const effectiveViewBox = svgData.viewBox || svgData._parentSVG.viewBox;
      const scaleX = width / effectiveViewBox.width;
      const scaleY = height / effectiveViewBox.height;

      this.push();
      this.translate(x, y);

      drawNode(this, svgData, effectiveViewBox, scaleX, scaleY, options);

      this.pop();
    };

    fn.drawSVGDebug = function (svgData, x, y, width, height) {
      const effectiveViewBox = svgData.viewBox || svgData._parentSVG.viewBox;
      const scaleX = width / effectiveViewBox.width;
      const scaleY = height / effectiveViewBox.height;

      this.push();
      this.translate(x, y);

      // Draw bounding boxes for all elements
      drawDebugNode(this, svgData, effectiveViewBox, scaleX, scaleY);

      this.pop();
    };

    // Helper functions
    function transformCoord(x, y, viewBox, scaleX, scaleY) {
      return {
        x: (x - viewBox.x) * scaleX,
        y: (y - viewBox.y) * scaleY,
      };
    }

    function drawNode(p, svgData, viewBox, scaleX, scaleY, options) {
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

    function drawShape(p, node, viewBox, scaleX, scaleY, options) {
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
        const transformedPoint = transformCoord(
          point.x,
          point.y,
          viewBox,
          scaleX,
          scaleY
        );
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
        const transformedPoint = transformCoord(
          point.x,
          point.y,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(transformedPoint.x, transformedPoint.y);
      });
      p.endShape(p.CLOSE);
    }

    function drawText(p, props, children, viewBox, scaleX, scaleY) {
      const x = parseFloat(props.x) || 0;
      const y = parseFloat(props.y) || 0;
      const textContent = children ? children[0].value : "";

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

    function drawPathCommands(
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

            const s1Rel = transformCoord(
              sx1Rel,
              sy1Rel,
              viewBox,
              scaleX,
              scaleY
            );
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

            const t1Rel = transformCoord(
              tx1Rel,
              ty1Rel,
              viewBox,
              scaleX,
              scaleY
            );
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
        const closePos = transformCoord(
          firstX,
          firstY,
          viewBox,
          scaleX,
          scaleY
        );
        p.vertex(closePos.x, closePos.y);
      }

      // Return the final position for the next path segment
      return {
        currentX: currentX,
        currentY: currentY,
      };
    }

    function parsePath(d) {
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

    function applyStyles(p, props) {
      p.noStroke();
      p.noFill();
      p.textSize(10);
      p.textAlign(p.LEFT);
      p.textFont("Arial");
      p.textStyle(p.NORMAL);
      p.drawingContext.globalAlpha = 1;

      if (props.fill === "none") {
        p.noFill();
      } else if (props.fill) {
        p.fill(props.fill);
      }

      if (props.stroke === "none") {
        p.noStroke();
      } else if (props.stroke) {
        p.stroke(props.stroke);
      }

      if (props["stroke-width"]) {
        p.strokeWeight(parseFloat(props["stroke-width"]));
      }

      if (props["font-size"]) {
        p.textSize(parseFloat(props["font-size"]));
      }

      if (props["font-family"]) {
        p.textFont(props["font-family"]);
      }

      if (props["text-anchor"]) {
        switch (props["text-anchor"]) {
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

    // Debug drawing functions
    function drawDebugNode(p, svgData, viewBox, scaleX, scaleY) {
      if (!svgData) return;

      if (svgData.tagName && svgData.tagName !== "svg") {
        drawDebugShape(p, svgData, viewBox, scaleX, scaleY);
      }

      if (svgData.children && svgData.children.length > 0) {
        svgData.children.forEach((child) => {
          drawDebugShape(p, child, viewBox, scaleX, scaleY);
          if (child.children && child.children.length > 0) {
            drawDebugNode(p, child, viewBox, scaleX, scaleY);
          }
        });
      }
    }

    function drawDebugShape(p, node, viewBox, scaleX, scaleY) {
      const props = node.properties || {};
      const bbox = calculateBoundingBox(node, viewBox, scaleX, scaleY);

      if (bbox) {
        // Draw bounding box - blue for groups, red for other elements
        p.push();
        p.noFill();
        p.stroke(
          node.tagName === "g" ? 0 : 255,
          0,
          node.tagName === "g" ? 255 : 0
        );
        p.strokeWeight(1);
        p.rect(bbox.x, bbox.y, bbox.width, bbox.height);
        p.pop();
      }
    }

    function calculateBoundingBox(node, viewBox, scaleX, scaleY) {
      switch (node.tagName) {
        case "g":
          return calculateGroupBoundingBox(node, viewBox, scaleX, scaleY);
        case "path":
          return calculatePathBoundingBox(
            node.properties.d,
            viewBox,
            scaleX,
            scaleY
          );
        case "rect":
          return calculateRectBoundingBox(
            node.properties,
            viewBox,
            scaleX,
            scaleY
          );
        case "circle":
          return calculateCircleBoundingBox(
            node.properties,
            viewBox,
            scaleX,
            scaleY
          );
        case "ellipse":
          return calculateEllipseBoundingBox(
            node.properties,
            viewBox,
            scaleX,
            scaleY
          );
        case "line":
          return calculateLineBoundingBox(
            node.properties,
            viewBox,
            scaleX,
            scaleY
          );
        case "polyline":
        case "polygon":
          return calculatePolyBoundingBox(
            node.properties,
            viewBox,
            scaleX,
            scaleY
          );
        case "text":
          return calculateTextBoundingBox(
            node.properties,
            node.children,
            viewBox,
            scaleX,
            scaleY
          );
        default:
          return null;
      }
    }

    function calculatePathBoundingBox(d, viewBox, scaleX, scaleY) {
      if (!d) return null;

      const bbox = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      };
      const commands = parsePath(d);
      let currentX = 0,
        currentY = 0;
      let startX = 0,
        startY = 0;
      let lastControlX = 0,
        lastControlY = 0;

      for (const cmd of commands) {
        switch (cmd.type) {
          case "M":
            currentX = cmd.x;
            currentY = cmd.y;
            startX = currentX;
            startY = currentY;
            addPoint(bbox, currentX, currentY);
            break;
          case "m":
            currentX += cmd.x;
            currentY += cmd.y;
            startX = currentX;
            startY = currentY;
            addPoint(bbox, currentX, currentY);
            break;
          case "L":
            currentX = cmd.x;
            currentY = cmd.y;
            addPoint(bbox, currentX, currentY);
            break;
          case "l":
            currentX += cmd.x;
            currentY += cmd.y;
            addPoint(bbox, currentX, currentY);
            break;
          case "H":
            currentX = cmd.x;
            addPoint(bbox, currentX, currentY);
            break;
          case "h":
            currentX += cmd.x;
            addPoint(bbox, currentX, currentY);
            break;
          case "V":
            currentY = cmd.y;
            addPoint(bbox, currentX, currentY);
            break;
          case "v":
            currentY += cmd.y;
            addPoint(bbox, currentX, currentY);
            break;
          case "C":
            addCubicBezierBounds(
              bbox,
              currentX,
              currentY,
              cmd.x1,
              cmd.y1,
              cmd.x2,
              cmd.y2,
              cmd.x,
              cmd.y
            );
            lastControlX = cmd.x2;
            lastControlY = cmd.y2;
            currentX = cmd.x;
            currentY = cmd.y;
            break;
          case "c":
            const c1x = currentX + cmd.x1;
            const c1y = currentY + cmd.y1;
            const c2x = currentX + cmd.x2;
            const c2y = currentY + cmd.y2;
            const endX = currentX + cmd.x;
            const endY = currentY + cmd.y;
            addCubicBezierBounds(
              bbox,
              currentX,
              currentY,
              c1x,
              c1y,
              c2x,
              c2y,
              endX,
              endY
            );
            lastControlX = c2x;
            lastControlY = c2y;
            currentX = endX;
            currentY = endY;
            break;
          case "S":
            const sx1 = lastControlX ? 2 * currentX - lastControlX : currentX;
            const sy1 = lastControlY ? 2 * currentY - lastControlY : currentY;
            addCubicBezierBounds(
              bbox,
              currentX,
              currentY,
              sx1,
              sy1,
              cmd.x2,
              cmd.y2,
              cmd.x,
              cmd.y
            );
            lastControlX = cmd.x2;
            lastControlY = cmd.y2;
            currentX = cmd.x;
            currentY = cmd.y;
            break;
          case "s":
            const sx1Rel = lastControlX
              ? 2 * currentX - lastControlX
              : currentX;
            const sy1Rel = lastControlY
              ? 2 * currentY - lastControlY
              : currentY;
            const sc2x = currentX + cmd.x2;
            const sc2y = currentY + cmd.y2;
            const sendX = currentX + cmd.x;
            const sendY = currentY + cmd.y;
            addCubicBezierBounds(
              bbox,
              currentX,
              currentY,
              sx1Rel,
              sy1Rel,
              sc2x,
              sc2y,
              sendX,
              sendY
            );
            lastControlX = sc2x;
            lastControlY = sc2y;
            currentX = sendX;
            currentY = sendY;
            break;
          case "Q":
            addQuadraticBezierBounds(
              bbox,
              currentX,
              currentY,
              cmd.x1,
              cmd.y1,
              cmd.x,
              cmd.y
            );
            lastControlX = cmd.x1;
            lastControlY = cmd.y1;
            currentX = cmd.x;
            currentY = cmd.y;
            break;
          case "q":
            const qc1x = currentX + cmd.x1;
            const qc1y = currentY + cmd.y1;
            const qendX = currentX + cmd.x;
            const qendY = currentY + cmd.y;
            addQuadraticBezierBounds(
              bbox,
              currentX,
              currentY,
              qc1x,
              qc1y,
              qendX,
              qendY
            );
            lastControlX = qc1x;
            lastControlY = qc1y;
            currentX = qendX;
            currentY = qendY;
            break;
          case "T":
            const tx1 = lastControlX ? 2 * currentX - lastControlX : currentX;
            const ty1 = lastControlY ? 2 * currentY - lastControlY : currentY;
            addQuadraticBezierBounds(
              bbox,
              currentX,
              currentY,
              tx1,
              ty1,
              cmd.x,
              cmd.y
            );
            lastControlX = tx1;
            lastControlY = ty1;
            currentX = cmd.x;
            currentY = cmd.y;
            break;
          case "t":
            const tx1Rel = lastControlX
              ? 2 * currentX - lastControlX
              : currentX;
            const ty1Rel = lastControlY
              ? 2 * currentY - lastControlY
              : currentY;
            const tendX = currentX + cmd.x;
            const tendY = currentY + cmd.y;
            addQuadraticBezierBounds(
              bbox,
              currentX,
              currentY,
              tx1Rel,
              ty1Rel,
              tendX,
              tendY
            );
            lastControlX = tx1Rel;
            lastControlY = ty1Rel;
            currentX = tendX;
            currentY = tendY;
            break;
          case "A":
            addArcBounds(
              bbox,
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
            currentX = cmd.x;
            currentY = cmd.y;
            break;
          case "a":
            const aendX = currentX + cmd.x;
            const aendY = currentY + cmd.y;
            addArcBounds(
              bbox,
              currentX,
              currentY,
              cmd.rx,
              cmd.ry,
              cmd.xAxisRotation,
              cmd.largeArcFlag,
              cmd.sweepFlag,
              aendX,
              aendY
            );
            currentX = aendX;
            currentY = aendY;
            break;
          case "Z":
          case "z":
            if (currentX !== startX || currentY !== startY) {
              addPoint(bbox, startX, startY);
            }
            currentX = startX;
            currentY = startY;
            break;
        }
      }

      if (bbox.minX === Infinity) return null;

      return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
    }

    function calculateRectBoundingBox(props, viewBox, scaleX, scaleY) {
      const x = parseFloat(props.x) || 0;
      const y = parseFloat(props.y) || 0;
      const width = parseFloat(props.width) || 0;
      const height = parseFloat(props.height) || 0;

      const bbox = { minX: x, minY: y, maxX: x + width, maxY: y + height };
      return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
    }

    function calculateCircleBoundingBox(props, viewBox, scaleX, scaleY) {
      const cx = parseFloat(props.cx) || 0;
      const cy = parseFloat(props.cy) || 0;
      const r = parseFloat(props.r) || 0;

      const bbox = { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r };
      return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
    }

    function calculateEllipseBoundingBox(props, viewBox, scaleX, scaleY) {
      const cx = parseFloat(props.cx) || 0;
      const cy = parseFloat(props.cy) || 0;
      const rx = parseFloat(props.rx) || 0;
      const ry = parseFloat(props.ry) || 0;

      const bbox = {
        minX: cx - rx,
        minY: cy - ry,
        maxX: cx + rx,
        maxY: cy + ry,
      };
      return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
    }

    function calculateLineBoundingBox(props, viewBox, scaleX, scaleY) {
      const x1 = parseFloat(props.x1) || 0;
      const y1 = parseFloat(props.y1) || 0;
      const x2 = parseFloat(props.x2) || 0;
      const y2 = parseFloat(props.y2) || 0;

      const bbox = {
        minX: Math.min(x1, x2),
        minY: Math.min(y1, y2),
        maxX: Math.max(x1, x2),
        maxY: Math.max(y1, y2),
      };
      return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
    }

    function calculatePolyBoundingBox(props, viewBox, scaleX, scaleY) {
      if (!props.points) return null;

      const points = parsePoints(props.points);
      if (points.length === 0) return null;

      const bbox = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      };

      points.forEach((point) => {
        addPoint(bbox, point.x, point.y);
      });

      return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
    }

    function calculateTextBoundingBox(
      props,
      children,
      viewBox,
      scaleX,
      scaleY
    ) {
      const x = parseFloat(props.x) || 0;
      const y = parseFloat(props.y) || 0;
      const textContent = children ? children[0].value : "";

      if (!textContent) return null;

      // Simple text bounding box approximation
      const fontSize = parseFloat(props["font-size"]) || 10;
      const bbox = {
        minX: x,
        minY: y - fontSize,
        maxX: x + textContent.length * fontSize * 0.6,
        maxY: y,
      };

      return transformBoundingBox(bbox, viewBox, scaleX, scaleY);
    }

    function calculateGroupBoundingBox(node, viewBox, scaleX, scaleY) {
      if (!node.children || node.children.length === 0) return null;

      const groupBbox = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      };

      // Calculate bounding box by combining all child element bounds
      for (const child of node.children) {
        const childBbox = calculateBoundingBox(child, viewBox, scaleX, scaleY);
        if (childBbox) {
          // Convert back to viewBox coordinates for proper combination
          const childMinX = childBbox.x / scaleX + viewBox.x;
          const childMinY = childBbox.y / scaleY + viewBox.y;
          const childMaxX = childMinX + childBbox.width / scaleX;
          const childMaxY = childMinY + childBbox.height / scaleY;

          groupBbox.minX = Math.min(groupBbox.minX, childMinX);
          groupBbox.minY = Math.min(groupBbox.minY, childMinY);
          groupBbox.maxX = Math.max(groupBbox.maxX, childMaxX);
          groupBbox.maxY = Math.max(groupBbox.maxY, childMaxY);
        }
      }

      if (groupBbox.minX === Infinity) return null;

      return transformBoundingBox(groupBbox, viewBox, scaleX, scaleY);
    }

    // Helper functions for precise bezier curve bounding box calculation
    function addCubicBezierBounds(bbox, x0, y0, x1, y1, x2, y2, x3, y3) {
      addPoint(bbox, x0, y0);
      addPoint(bbox, x3, y3);

      // Find extrema by solving derivatives
      const a_x = -x0 + 3 * x1 - 3 * x2 + x3;
      const b_x = 2 * x0 - 4 * x1 + 2 * x2;
      const c_x = -x0 + x1;

      const t_vals_x = solveQuadratic(a_x, b_x, c_x);
      for (const t of t_vals_x) {
        if (t >= 0 && t <= 1) {
          const x =
            Math.pow(1 - t, 3) * x0 +
            3 * Math.pow(1 - t, 2) * t * x1 +
            3 * (1 - t) * Math.pow(t, 2) * x2 +
            Math.pow(t, 3) * x3;
          const y =
            Math.pow(1 - t, 3) * y0 +
            3 * Math.pow(1 - t, 2) * t * y1 +
            3 * (1 - t) * Math.pow(t, 2) * y2 +
            Math.pow(t, 3) * y3;
          addPoint(bbox, x, y);
        }
      }

      const a_y = -y0 + 3 * y1 - 3 * y2 + y3;
      const b_y = 2 * y0 - 4 * y1 + 2 * y2;
      const c_y = -y0 + y1;

      const t_vals_y = solveQuadratic(a_y, b_y, c_y);
      for (const t of t_vals_y) {
        if (t >= 0 && t <= 1) {
          const x =
            Math.pow(1 - t, 3) * x0 +
            3 * Math.pow(1 - t, 2) * t * x1 +
            3 * (1 - t) * Math.pow(t, 2) * x2 +
            Math.pow(t, 3) * x3;
          const y =
            Math.pow(1 - t, 3) * y0 +
            3 * Math.pow(1 - t, 2) * t * y1 +
            3 * (1 - t) * Math.pow(t, 2) * y2 +
            Math.pow(t, 3) * y3;
          addPoint(bbox, x, y);
        }
      }
    }

    function addQuadraticBezierBounds(bbox, x0, y0, x1, y1, x2, y2) {
      addPoint(bbox, x0, y0);
      addPoint(bbox, x2, y2);

      // Find extrema
      const t_x = (x0 - x1) / (x0 - 2 * x1 + x2);
      if (t_x >= 0 && t_x <= 1 && !isNaN(t_x)) {
        const x =
          Math.pow(1 - t_x, 2) * x0 +
          2 * (1 - t_x) * t_x * x1 +
          Math.pow(t_x, 2) * x2;
        const y =
          Math.pow(1 - t_x, 2) * y0 +
          2 * (1 - t_x) * t_x * y1 +
          Math.pow(t_x, 2) * y2;
        addPoint(bbox, x, y);
      }

      const t_y = (y0 - y1) / (y0 - 2 * y1 + y2);
      if (t_y >= 0 && t_y <= 1 && !isNaN(t_y)) {
        const x =
          Math.pow(1 - t_y, 2) * x0 +
          2 * (1 - t_y) * t_y * x1 +
          Math.pow(t_y, 2) * x2;
        const y =
          Math.pow(1 - t_y, 2) * y0 +
          2 * (1 - t_y) * t_y * y1 +
          Math.pow(t_y, 2) * y2;
        addPoint(bbox, x, y);
      }
    }

    function addArcBounds(
      bbox,
      x1,
      y1,
      rx,
      ry,
      rotation,
      largeArc,
      sweep,
      x2,
      y2
    ) {
      // Simplified arc bounds - add start, end, and approximate bounds
      addPoint(bbox, x1, y1);
      addPoint(bbox, x2, y2);

      const cos_rot = Math.cos((rotation * Math.PI) / 180);
      const sin_rot = Math.sin((rotation * Math.PI) / 180);

      const max_x = Math.abs(rx * cos_rot) + Math.abs(ry * sin_rot);
      const max_y = Math.abs(rx * sin_rot) + Math.abs(ry * cos_rot);

      addPoint(bbox, x1 - max_x, y1 - max_y);
      addPoint(bbox, x1 + max_x, y1 + max_y);
      addPoint(bbox, x2 - max_x, y2 - max_y);
      addPoint(bbox, x2 + max_x, y2 + max_y);
    }

    function solveQuadratic(a, b, c) {
      const solutions = [];

      if (Math.abs(a) < 1e-10) {
        if (Math.abs(b) > 1e-10) {
          solutions.push(-c / b);
        }
      } else {
        const discriminant = b * b - 4 * a * c;
        if (discriminant >= 0) {
          const sqrt_d = Math.sqrt(discriminant);
          solutions.push((-b + sqrt_d) / (2 * a));
          solutions.push((-b - sqrt_d) / (2 * a));
        }
      }

      return solutions;
    }

    function addPoint(bbox, x, y) {
      bbox.minX = Math.min(bbox.minX, x);
      bbox.minY = Math.min(bbox.minY, y);
      bbox.maxX = Math.max(bbox.maxX, x);
      bbox.maxY = Math.max(bbox.maxY, y);
    }

    function transformBoundingBox(bbox, viewBox, scaleX, scaleY) {
      const x = (bbox.minX - viewBox.x) * scaleX;
      const y = (bbox.minY - viewBox.y) * scaleY;
      const width = (bbox.maxX - bbox.minX) * scaleX;
      const height = (bbox.maxY - bbox.minY) * scaleY;

      return { x, y, width, height };
    }

    // Lifecycle hooks
    lifecycles.presetup = function () {
      console.log("⚙️ p5-svg-loader initialized");
    };
  };

  // Register the addon with P5.js 2.0
  if (typeof p5 !== "undefined" && p5.registerAddon) {
    p5.registerAddon(p5SvgLoaderAddon);
  } else {
    // Fallback for P5.js 1.x compatibility
    console.warn(
      "p5-svg-loader: P5.js 2.0 addon system not available, falling back to 1.x compatibility"
    );

    // Legacy P5.js 1.x support
    p5.prototype.loadSVG = function (filename, callback) {
      console.log(`Loading SVG file: ${filename}`);

      const result = {
        data: null,
        error: null,
        filename: filename,
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
      p5.prototype.registerPreloadMethod("loadSVG", p5.prototype);
    }

    p5.prototype.drawSVG = function (svgData, x, y, width, height) {
      this.fill(255, 0, 0);
      this.noStroke();
      this.rect(x, y, width, height);
    };

    // Legacy lifecycle hooks
    if (p5.prototype.registerMethod) {
      p5.prototype.svgLoaderInit = function () {
        console.log("p5-svg-loader initialized (legacy mode)");
      };
      p5.prototype.registerMethod("init", p5.prototype.svgLoaderInit);
    }
  }

  // Export for module systems
  if (typeof module !== "undefined" && module.exports) {
    module.exports = p5;
  }
})();
