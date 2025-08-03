/**
 * Command parser for pre-processing SVG elements into drawing commands
 * This module handles all parsing logic at load-time for better performance
 */

import { parsePoints } from "./utils.js";

/**
 * Parse SVG path data into command objects
 * @param {string} d - SVG path data string
 * @param {boolean} convertLines - Whether to convert H/V commands to L/l
 * @returns {Array} Array of command objects
 */
export function parsePath(d, convertLines = true) {
  if (!d) return [];

  // Tokenize the path data
  const tokens = d.match(/[a-z][^a-z]*/gi) || [];
  const commands = [];

  // Keep track of current position to convert H and V commands
  let currentX = 0;
  let currentY = 0;

  tokens.forEach((token) => {
    const type = token[0];
    const args = [];
    const numberRegex = /[+-]?(?:\d*\.\d+|\d+)(?:[eE][+-]?\d+)?/g;
    let match;
    const argString = token.slice(1).replace(/,/g, " ");
    while ((match = numberRegex.exec(argString)) !== null) {
      args.push(parseFloat(match[0]));
    }

    // Fix 3: Add validation
    const expectedCounts = {
      M: 2,
      m: 2,
      L: 2,
      l: 2,
      H: 1,
      h: 1,
      V: 1,
      v: 1,
      C: 6,
      c: 6,
      S: 4,
      s: 4,
      Q: 4,
      q: 4,
      T: 2,
      t: 2,
      A: 7,
      a: 7,
      Z: 0,
      z: 0,
    };

    if (expectedCounts[type] && args.length % expectedCounts[type] !== 0) {
      console.warn(
        `Invalid ${type} command: expected multiple of ${expectedCounts[type]}, got ${args.length}: ${token} ${args}`
      );
    }

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
        if (convertLines) {
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
        } else {
          // Keep as H command - preserve SVG properties
          args.forEach((arg) => {
            const newX = arg;
            commands.push({
              type: "H",
              x: newX,
            });
            currentX = newX;
          });
        }
        break;

      case "h": // Horizontal Line (relative)
        if (convertLines) {
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
        } else {
          // Keep as h command - preserve SVG properties
          args.forEach((arg) => {
            const relX = arg;
            currentX += relX;
            commands.push({
              type: "h",
              x: relX,
            });
          });
        }
        break;

      case "V": // Vertical Line (absolute)
        if (convertLines) {
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
        } else {
          // Keep as V command - preserve SVG properties
          args.forEach((arg) => {
            const newY = arg;
            commands.push({
              type: "V",
              y: newY,
            });
            currentY = newY;
          });
        }
        break;

      case "v": // Vertical Line (relative)
        if (convertLines) {
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
        } else {
          // Keep as v command - preserve SVG properties
          args.forEach((arg) => {
            const relY = arg;
            currentY += relY;
            commands.push({
              type: "v",
              y: relY,
            });
          });
        }
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

/**
 * Parse points string into array of point objects
 * @param {string} pointsStr - Points string from polyline/polygon
 * @returns {Array} Array of point objects with x, y coordinates
 */
export function parsePointsToCommands(pointsStr) {
  if (!pointsStr) return [];

  const points = parsePoints(pointsStr);
  return points.map((point) => ({
    type: "point",
    x: point.x,
    y: point.y,
  }));
}

/**
 * Parse rectangle properties into command objects
 * @param {Object} props - Rectangle properties
 * @returns {Object} Rectangle command object
 */
export function parseRectToCommands(props) {
  return {
    type: "rect",
    x: parseFloat(props.x) || 0,
    y: parseFloat(props.y) || 0,
    width: parseFloat(props.width) || 0,
    height: parseFloat(props.height) || 0,
  };
}

/**
 * Parse circle properties into command objects
 * @param {Object} props - Circle properties
 * @returns {Object} Circle command object
 */
export function parseCircleToCommands(props) {
  return {
    type: "circle",
    cx: parseFloat(props.cx) || 0,
    cy: parseFloat(props.cy) || 0,
    r: parseFloat(props.r) || 0,
  };
}

/**
 * Parse ellipse properties into command objects
 * @param {Object} props - Ellipse properties
 * @returns {Object} Ellipse command object
 */
export function parseEllipseToCommands(props) {
  return {
    type: "ellipse",
    cx: parseFloat(props.cx) || 0,
    cy: parseFloat(props.cy) || 0,
    rx: parseFloat(props.rx) || 0,
    ry: parseFloat(props.ry) || 0,
  };
}

/**
 * Parse line properties into command objects
 * @param {Object} props - Line properties
 * @returns {Object} Line command object
 */
export function parseLineToCommands(props) {
  return {
    type: "line",
    x1: parseFloat(props.x1) || 0,
    y1: parseFloat(props.y1) || 0,
    x2: parseFloat(props.x2) || 0,
    y2: parseFloat(props.y2) || 0,
  };
}

/**
 * Parse text properties into command objects
 * @param {Object} props - Text properties
 * @param {Array} children - Text children (for content)
 * @returns {Object} Text command object
 */
export function parseTextToCommands(props, children) {
  const textContent = children && children.length > 0 ? children[0].value : "";

  return {
    type: "text",
    x: parseFloat(props.x) || 0,
    y: parseFloat(props.y) || 0,
    content: textContent,
  };
}

/**
 * Pre-process styles into a standardized format
 * @param {Object} props - Element properties
 * @returns {Object} Processed styles object
 */
export function preprocessStyles(props) {
  const styles = {};

  if (props.fill === "none") {
    styles.fill = "none";
  } else if (props.fill) {
    styles.fill = props.fill;
  }

  if (props["fill-opacity"] !== undefined) {
    styles.fillOpacity = parseFloat(props["fill-opacity"]);
  }

  if (props.stroke === "none") {
    styles.stroke = "none";
  } else if (props.stroke) {
    styles.stroke = props.stroke;
  }

  if (props["stroke-opacity"] !== undefined) {
    styles.strokeOpacity = parseFloat(props["stroke-opacity"]);
  }

  if (props["stroke-width"] !== undefined) {
    styles.strokeWidth = parseFloat(props["stroke-width"]);
  }

  if (props["stroke-linecap"]) {
    styles.strokeLinecap = props["stroke-linecap"];
  }

  if (props["stroke-linejoin"]) {
    styles.strokeLinejoin = props["stroke-linejoin"];
  }

  if (props["font-size"] !== undefined) {
    styles.fontSize = parseFloat(props["font-size"]);
  }

  if (props["font-family"]) {
    styles.fontFamily = props["font-family"];
  }

  if (props["text-anchor"]) {
    styles.textAnchor = props["text-anchor"];
  }

  // Opacity
  if (props.opacity !== undefined) {
    const opacity = parseFloat(props.opacity);
    if (opacity >= 0 && opacity <= 1) {
      styles.opacity = opacity;
    }
  }

  return styles;
}
