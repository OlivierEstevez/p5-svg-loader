/**
 * Utility functions for coordinate transformations and parsing
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

export function applyStyles(p, props) {
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
}
