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
