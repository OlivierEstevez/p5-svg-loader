/**
 * Core SVG class for p5-svg-loader
 * Handles SVG parsing and basic structure
 */

import { parse } from "svg-parser";
import { calculateBoundingBox } from "./bounding-box.js";
import {
  parsePath,
  parsePointsToCommands,
  parseRectToCommands,
  parseCircleToCommands,
  parseEllipseToCommands,
  parseLineToCommands,
  parseTextToCommands,
  preprocessStyles,
} from "./command-parser.js";

export class SVG {
  constructor(svgString, options) {
    const parsed = parse(svgString);
    const svg = parsed.children[0];

    this.viewBox = this._parseViewBox(svg.properties.viewBox);
    this.width = parseFloat(svg.properties.width) || this.viewBox.width;
    this.height = parseFloat(svg.properties.height) || this.viewBox.height;

    const children = parsed.children[0].children;
    this.children = this._preParse(children, options);
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

  _addParentViewbox(children, viewBox) {
    children.forEach((child) => {
      child.viewBox = viewBox;
      if (child.children && child.children.length > 0) {
        this._addParentViewbox(child.children, viewBox);
      }
    });
  }

  _preParse(children, options) {
    if (!children || children.length === 0) return [];

    this._addParentViewbox(children, this.viewBox);

    return children.map((child) => this._elementToCommands(child, options));
  }

  _elementToCommands(element, options) {
    const props = element.properties || {};
    const children = element.children || [];

    // Pre-process styles
    const styles = preprocessStyles(props);

    // Parse element based on type
    let commands = [];
    let elementType = "";

    try {
      switch (element.tagName) {
        case "path":
          elementType = "path";
          commands = parsePath(props.d, options.convertLines);
          break;

        case "rect":
          elementType = "rect";
          commands = [parseRectToCommands(props)];
          break;

        case "circle":
          elementType = "circle";
          commands = [parseCircleToCommands(props)];
          break;

        case "ellipse":
          elementType = "ellipse";
          commands = [parseEllipseToCommands(props)];
          break;

        case "line":
          elementType = "line";
          commands = [parseLineToCommands(props)];
          break;

        case "polyline":
          elementType = "polyline";
          commands = parsePointsToCommands(props.points);
          break;

        case "polygon":
          elementType = "polygon";
          commands = parsePointsToCommands(props.points);
          break;

        case "text":
          elementType = "text";
          commands = [parseTextToCommands(props, children)];
          break;

        case "g":
        case "svg":
          elementType = "group";
          // For groups, recursively parse children
          const childCommands = this._preParse(children, options);
          return {
            type: elementType,
            styles: styles,
            children: childCommands,
            viewBox: element.viewBox,
            bounds: calculateBoundingBox(
              {
                type: elementType,
                commands: commands,
                viewBox: element.viewBox,
                children: childCommands,
              },
              element.viewBox,
              1,
              1
            ),
          };

        default:
          // Unknown element type - skip or handle as needed
          console.warn(`Unknown SVG element type: ${element.tagName}`);
          return null;
      }
    } catch (error) {
      console.error(`Error parsing SVG element ${element.tagName}:`, error);
      return null;
    }

    // Calculate bounding box for the commands
    const bounds = calculateBoundingBox(
      {
        type: elementType,
        commands: commands,
        viewBox: element.viewBox,
      },
      element.viewBox,
      1,
      1
    );

    return {
      type: elementType,
      commands: commands,
      styles: styles,
      bounds: bounds,
      viewBox: element.viewBox,
    };
  }
}
