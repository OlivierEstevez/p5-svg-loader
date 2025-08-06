/**
 * Utility functions: Coordinate transformations, parsing and styling
 */

export function transformCoord(x, y, viewBox, scaleX, scaleY) {
  return {
    x: (x - viewBox.x) * scaleX,
    y: (y - viewBox.y) * scaleY,
  };
}

export function parsePoints(pointsStr) {
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

export function parseStrokeDasharray(dashArrayStr) {
  if (!dashArrayStr || dashArrayStr === "none") {
    return null;
  }

  const dashArray = dashArrayStr
    .split(/[,\s]+/)
    .map((val) => parseFloat(val.trim()))
    .filter((val) => !isNaN(val));

  return dashArray.length > 0 ? dashArray : null;
}

/**
 * Parse SVG transform attribute into an array of transform objects
 * @param {string} transformStr - The transform attribute value
 * @returns {Array} Array of transform objects with type and parameters
 */
export function preprocessTransforms(transformStr) {
  if (!transformStr || typeof transformStr !== "string") {
    return [];
  }

  const transforms = [];

  // Match transform functions: functionName(parameters)
  const transformRegex = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
  let match;

  while ((match = transformRegex.exec(transformStr)) !== null) {
    const functionName = match[1].toLowerCase();
    const parameters = match[2]
      .split(/[,\s]+/)
      .map((val) => val.trim())
      .filter((val) => val.length > 0)
      .map((val) => parseFloat(val));

    const validParams = parameters.filter((val) => !isNaN(val));

    switch (functionName) {
      case "matrix":
        if (validParams.length === 6) {
          transforms.push({
            type: "matrix",
            a: validParams[0],
            b: validParams[1],
            c: validParams[2],
            d: validParams[3],
            e: validParams[4],
            f: validParams[5],
          });
        }
        break;

      case "translate":
        if (validParams.length === 1) {
          transforms.push({
            type: "translate",
            x: validParams[0],
            y: 0,
          });
        } else if (validParams.length === 2) {
          transforms.push({
            type: "translate",
            x: validParams[0],
            y: validParams[1],
          });
        }
        break;

      case "translatex":
        if (validParams.length === 1) {
          transforms.push({
            type: "translateX",
            x: validParams[0],
          });
        }
        break;

      case "translatey":
        if (validParams.length === 1) {
          transforms.push({
            type: "translateY",
            y: validParams[0],
          });
        }
        break;

      case "scale":
        if (validParams.length === 1) {
          transforms.push({
            type: "scale",
            x: validParams[0],
            y: validParams[0],
          });
        } else if (validParams.length === 2) {
          transforms.push({
            type: "scale",
            x: validParams[0],
            y: validParams[1],
          });
        }
        break;

      case "scalex":
        if (validParams.length === 1) {
          transforms.push({
            type: "scaleX",
            x: validParams[0],
          });
        }
        break;

      case "scaley":
        if (validParams.length === 1) {
          transforms.push({
            type: "scaleY",
            y: validParams[0],
          });
        }
        break;

      case "rotate":
        if (validParams.length === 1) {
          transforms.push({
            type: "rotate",
            angle: validParams[0],
          });
        } else if (validParams.length === 3) {
          transforms.push({
            type: "rotate",
            angle: validParams[0],
            cx: validParams[1],
            cy: validParams[2],
          });
        }
        break;

      case "skewx":
        if (validParams.length === 1) {
          transforms.push({
            type: "skewX",
            angle: validParams[0],
          });
        }
        break;

      case "skewy":
        if (validParams.length === 1) {
          transforms.push({
            type: "skewY",
            angle: validParams[0],
          });
        }
        break;
    }
  }

  return transforms;
}
