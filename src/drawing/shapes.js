/**
 * Drawing functions for basic SVG shapes
 */

import { transformCoord, applyStyles, parsePoints } from "../core/utils.js";

export function drawRect(p, props, viewBox, scaleX, scaleY) {
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

export function drawCircle(p, props, viewBox, scaleX, scaleY) {
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

export function drawEllipse(p, props, viewBox, scaleX, scaleY) {
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

export function drawLine(p, props, viewBox, scaleX, scaleY) {
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

export function drawPolyline(p, props, viewBox, scaleX, scaleY) {
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

export function drawPolygon(p, props, viewBox, scaleX, scaleY) {
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

export function drawText(p, props, children, viewBox, scaleX, scaleY) {
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
