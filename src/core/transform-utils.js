/**
 * Apply transformation matrix to a point
 * @param {Object} matrix - Transformation matrix {a, b, c, d, e, f}
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object} Transformed point {x, y}
 */
export function applyMatrixToPoint(matrix, x, y) {
  return {
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f,
  };
}

/**
 * Build transformation matrix from transforms array
 * @param {Array} transforms - Array of transform objects
 * @returns {Object} Transformation matrix {a, b, c, d, e, f}
 */
export function buildTransformationMatrix(transforms) {
  if (!transforms || transforms.length === 0) {
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  }

  let matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

  function multiplyMatrix(m1, m2) {
    return {
      a: m1.a * m2.a + m1.c * m2.b,
      b: m1.b * m2.a + m1.d * m2.b,
      c: m1.a * m2.c + m1.c * m2.d,
      d: m1.b * m2.c + m1.d * m2.d,
      e: m1.a * m2.e + m1.c * m2.f + m1.e,
      f: m1.b * m2.e + m1.d * m2.f + m1.f,
    };
  }

  function createTranslateMatrix(tx, ty) {
    return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
  }

  function createRotateMatrix(angle) {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
  }

  function createRotateAroundPointMatrix(angle, cx, cy) {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
      a: cos,
      b: sin,
      c: -sin,
      d: cos,
      e: cx - cx * cos + cy * sin,
      f: cy - cx * sin - cy * cos,
    };
  }

  function createScaleMatrix(sx, sy) {
    return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
  }

  function createSkewXMatrix(angle) {
    const radians = (angle * Math.PI) / 180;
    const tan = Math.tan(radians);
    return { a: 1, b: 0, c: tan, d: 1, e: 0, f: 0 };
  }

  function createSkewYMatrix(angle) {
    const radians = (angle * Math.PI) / 180;
    const tan = Math.tan(radians);
    return { a: 1, b: tan, c: 0, d: 1, e: 0, f: 0 };
  }

  transforms.forEach((transform) => {
    let transformMatrix;

    switch (transform.type) {
      case "translate":
        transformMatrix = createTranslateMatrix(
          transform.x || 0,
          transform.y || 0
        );
        break;
      case "translateX":
        transformMatrix = createTranslateMatrix(
          transform.x || transform.value || 0,
          0
        );
        break;
      case "translateY":
        transformMatrix = createTranslateMatrix(
          0,
          transform.y || transform.value || 0
        );
        break;
      case "rotate":
        if (transform.cx !== undefined || transform.cy !== undefined) {
          transformMatrix = createRotateAroundPointMatrix(
            transform.angle || 0,
            transform.cx || 0,
            transform.cy || 0
          );
        } else {
          transformMatrix = createRotateMatrix(transform.angle || 0);
        }
        break;
      case "scale":
        const sx = transform.x || transform.sx || 1;
        const sy = transform.y || transform.sy || sx;
        transformMatrix = createScaleMatrix(sx, sy);
        break;
      case "scaleX":
        transformMatrix = createScaleMatrix(
          transform.x || transform.value || 1,
          1
        );
        break;
      case "scaleY":
        transformMatrix = createScaleMatrix(
          1,
          transform.y || transform.value || 1
        );
        break;
      case "skewX":
        transformMatrix = createSkewXMatrix(
          transform.angle || transform.value || 0
        );
        break;
      case "skewY":
        transformMatrix = createSkewYMatrix(
          transform.angle || transform.value || 0
        );
        break;
      case "matrix":
        transformMatrix = {
          a: transform.a || 1,
          b: transform.b || 0,
          c: transform.c || 0,
          d: transform.d || 1,
          e: transform.e || 0,
          f: transform.f || 0,
        };
        break;
      default:
        transformMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
        break;
    }

    matrix = multiplyMatrix(matrix, transformMatrix);
  });

  return matrix;
}

/**
 * Apply transforms to path commands with proper coordinate handling
 * @param {Array} commands - Array of path commands
 * @param {Array} transforms - Array of transform objects
 * @returns {Array} Transformed path commands
 */
export function applyTransformsToPath(commands, transforms) {
  // Convert all relative commands to absolute and H/V to L in one pass
  const absoluteCommands = normalizePathCommands(commands);

  // Apply transformation matrix to each command (if any transforms)
  if (!transforms || transforms.length === 0) {
    return absoluteCommands;
  }

  const matrix = buildTransformationMatrix(transforms);
  return absoluteCommands.map((command) =>
    applyMatrixToCommand(command, matrix)
  );
}

/**
 * Convert all SVG path commands to absolute coordinates and convert H/V to L
 * @param {Array} commands - Array of path commands
 * @returns {Array} Commands with all relative converted to absolute and H/V converted to L
 */
function normalizePathCommands(commands) {
  let currentX = 0;
  let currentY = 0;
  let hasInitialMove = false;
  let pathStartX = 0;
  let pathStartY = 0;

  return commands.map((command) => {
    const newCommand = { ...command };

    switch (command.type) {
      case "M":
        currentX = command.x;
        currentY = command.y;
        pathStartX = currentX;
        pathStartY = currentY;
        hasInitialMove = true;
        break;

      case "m":
        if (!hasInitialMove) {
          // First command is relative move - treat as absolute
          currentX = command.x;
          currentY = command.y;
          pathStartX = currentX;
          pathStartY = currentY;
          hasInitialMove = true;
        } else {
          // Subsequent relative move
          currentX += command.x;
          currentY += command.y;
          pathStartX = currentX;
          pathStartY = currentY;
        }
        newCommand.type = "M";
        newCommand.x = currentX;
        newCommand.y = currentY;
        break;

      case "L":
        currentX = command.x;
        currentY = command.y;
        break;

      case "l":
        if (!hasInitialMove) {
          // First command is relative line - treat as absolute
          currentX = command.x;
          currentY = command.y;
          pathStartX = currentX;
          pathStartY = currentY;
          hasInitialMove = true;
        } else {
          // Subsequent relative line
          currentX += command.x;
          currentY += command.y;
        }
        newCommand.type = "L";
        newCommand.x = currentX;
        newCommand.y = currentY;
        break;

      case "H":
        // Convert H to L
        newCommand.type = "L";
        newCommand.y = currentY;
        currentX = command.x;
        break;

      case "h":
        // Convert h to L
        if (!hasInitialMove) {
          // First command is relative horizontal - treat as absolute
          currentX = command.x;
          currentY = 0;
          pathStartX = currentX;
          pathStartY = currentY;
          hasInitialMove = true;
        } else {
          // Subsequent relative horizontal
          currentX += command.x;
        }
        newCommand.type = "L";
        newCommand.x = currentX;
        newCommand.y = currentY;
        break;

      case "V":
        // Convert V to L
        newCommand.type = "L";
        newCommand.x = currentX;
        currentY = command.y;
        if (!hasInitialMove) {
          pathStartX = currentX;
          pathStartY = currentY;
          hasInitialMove = true;
        }
        break;

      case "v":
        // Convert v to L
        if (!hasInitialMove) {
          // First command is relative vertical - treat as absolute
          currentX = 0;
          currentY = command.y;
          pathStartX = currentX;
          pathStartY = currentY;
          hasInitialMove = true;
        } else {
          // Subsequent relative vertical
          currentY += command.y;
        }
        newCommand.type = "L";
        newCommand.x = currentX;
        newCommand.y = currentY;
        break;

      case "C":
        currentX = command.x;
        currentY = command.y;
        break;

      case "c":
        // Convert relative cubic bezier to absolute
        newCommand.type = "C";
        newCommand.x1 = currentX + command.x1;
        newCommand.y1 = currentY + command.y1;
        newCommand.x2 = currentX + command.x2;
        newCommand.y2 = currentY + command.y2;
        newCommand.x = currentX + command.x;
        newCommand.y = currentY + command.y;
        currentX = newCommand.x;
        currentY = newCommand.y;
        break;

      case "S":
        currentX = command.x;
        currentY = command.y;
        break;

      case "s":
        // Convert relative smooth cubic bezier to absolute
        newCommand.type = "S";
        newCommand.x2 = currentX + command.x2;
        newCommand.y2 = currentY + command.y2;
        newCommand.x = currentX + command.x;
        newCommand.y = currentY + command.y;
        currentX = newCommand.x;
        currentY = newCommand.y;
        break;

      case "Q":
        currentX = command.x;
        currentY = command.y;
        break;

      case "q":
        // Convert relative quadratic bezier to absolute
        newCommand.type = "Q";
        newCommand.x1 = currentX + command.x1;
        newCommand.y1 = currentY + command.y1;
        newCommand.x = currentX + command.x;
        newCommand.y = currentY + command.y;
        currentX = newCommand.x;
        currentY = newCommand.y;
        break;

      case "T":
        currentX = command.x;
        currentY = command.y;
        break;

      case "t":
        // Convert relative smooth quadratic bezier to absolute
        newCommand.type = "T";
        newCommand.x = currentX + command.x;
        newCommand.y = currentY + command.y;
        currentX = newCommand.x;
        currentY = newCommand.y;
        break;

      case "A":
        currentX = command.x;
        currentY = command.y;
        break;

      case "a":
        // Convert relative arc to absolute
        newCommand.type = "A";
        newCommand.x = currentX + command.x;
        newCommand.y = currentY + command.y;
        currentX = newCommand.x;
        currentY = newCommand.y;
        break;

      case "Z":
      case "z":
        // Close path - return to the start of the current sub-path
        currentX = pathStartX;
        currentY = pathStartY;
        newCommand.type = "Z";
        break;
    }

    return newCommand;
  });
}

/**
 * Process multiple paths independently to avoid coordinate state bleeding
 * @param {Array} pathsData - Array of path data, each containing commands array
 * @param {Array} transforms - Array of transform objects (optional)
 * @returns {Array} Array of transformed path data
 */
export function normalizeMultiplePaths(pathsData, transforms = null) {
  return pathsData.map((pathData) => {
    const normalizedCommands = normalizePathCommands(
      pathData.commands || pathData
    );

    if (transforms && transforms.length > 0) {
      const matrix = buildTransformationMatrix(transforms);
      return normalizedCommands.map((command) =>
        applyMatrixToCommand(command, matrix)
      );
    }

    return normalizedCommands;
  });
}

/**
 * Apply transformation matrix to a single command
 * @param {Object} command - Path command object
 * @param {Object} matrix - Transformation matrix
 * @returns {Object} Transformed command
 */
function applyMatrixToCommand(command, matrix) {
  const newCommand = { ...command };

  switch (command.type) {
    case "M":
    case "L":
      if (typeof command.x === "number" && typeof command.y === "number") {
        const point = applyMatrixToPoint(matrix, command.x, command.y);
        newCommand.x = point.x;
        newCommand.y = point.y;
      }
      break;

    case "C":
      if (
        typeof command.x1 === "number" &&
        typeof command.y1 === "number" &&
        typeof command.x2 === "number" &&
        typeof command.y2 === "number" &&
        typeof command.x === "number" &&
        typeof command.y === "number"
      ) {
        const cp1 = applyMatrixToPoint(matrix, command.x1, command.y1);
        const cp2 = applyMatrixToPoint(matrix, command.x2, command.y2);
        const end = applyMatrixToPoint(matrix, command.x, command.y);
        newCommand.x1 = cp1.x;
        newCommand.y1 = cp1.y;
        newCommand.x2 = cp2.x;
        newCommand.y2 = cp2.y;
        newCommand.x = end.x;
        newCommand.y = end.y;
      }
      break;

    case "S":
      if (
        typeof command.x2 === "number" &&
        typeof command.y2 === "number" &&
        typeof command.x === "number" &&
        typeof command.y === "number"
      ) {
        const cp = applyMatrixToPoint(matrix, command.x2, command.y2);
        const end = applyMatrixToPoint(matrix, command.x, command.y);
        newCommand.x2 = cp.x;
        newCommand.y2 = cp.y;
        newCommand.x = end.x;
        newCommand.y = end.y;
      }
      break;

    case "Q":
      if (
        typeof command.x1 === "number" &&
        typeof command.y1 === "number" &&
        typeof command.x === "number" &&
        typeof command.y === "number"
      ) {
        const cp = applyMatrixToPoint(matrix, command.x1, command.y1);
        const end = applyMatrixToPoint(matrix, command.x, command.y);
        newCommand.x1 = cp.x;
        newCommand.y1 = cp.y;
        newCommand.x = end.x;
        newCommand.y = end.y;
      }
      break;

    case "T":
      if (typeof command.x === "number" && typeof command.y === "number") {
        const end = applyMatrixToPoint(matrix, command.x, command.y);
        newCommand.x = end.x;
        newCommand.y = end.y;
      }
      break;

    case "A":
      if (typeof command.x === "number" && typeof command.y === "number") {
        const end = applyMatrixToPoint(matrix, command.x, command.y);
        newCommand.x = end.x;
        newCommand.y = end.y;
      }
      break;

    case "Z":
    case "z":
      break;
  }

  return newCommand;
}
