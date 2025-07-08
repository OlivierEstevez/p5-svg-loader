/**
 * Core SVG class for p5-svg-loader
 * Handles SVG parsing and basic structure
 */

import { parse } from "svg-parser";

export class SVG {
  constructor(svgString) {
    const parsed = parse(svgString);
    const svg = parsed.children[0];

    this.width = parseFloat(svg.properties.width) || 100;
    this.height = parseFloat(svg.properties.height) || 100;
    this.viewBox = this._parseViewBox(svg.properties.viewBox);

    this.children = parsed.children[0].children;

    // Add reference to parent SVG in each child recursively
    this._addParentReference(this.children, this);
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
}
