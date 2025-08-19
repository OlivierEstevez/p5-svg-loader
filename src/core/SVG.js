/**
 * Core SVG class for p5-svg-loader
 * Handles SVG parsing and basic structure
 */

import { parse } from "svg-parser";
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
import { flattenTransforms } from "../drawing/path.js";

export class SVG {
  constructor(svgString, options = {}) {
    this.options = options;
    this._validateOptions(options);

    const parsed = parse(svgString);
    const svg = parsed.children[0];

    this.viewBox = this._parseViewBox(svg.properties.viewBox, svg.properties);
    this.width = parseFloat(svg.properties.width) || this.viewBox.width;
    this.height = parseFloat(svg.properties.height) || this.viewBox.height;

    const children = parsed.children[0].children;
    this.children = this._preParse(children, {});
  }

  _parseViewBox(viewBox, properties) {
    if (!viewBox)
      return {
        x: 0,
        y: 0,
        width: parseFloat(properties.width) || 0,
        height: parseFloat(properties.height) || 0,
      };

    const values = viewBox.split(/\s+/).map(parseFloat);
    return {
      x: values[0] || 0,
      y: values[1] || 0,
      width: values[2] || this.width,
      height: values[3] || this.height,
    };
  }

  _mergeStyles(inheritedStyles, elementStyles) {
    const { transform, ...inheritedWithoutTransform } = inheritedStyles || {};
    const merged = { ...inheritedWithoutTransform };

    Object.keys(elementStyles).forEach((prop) => {
      if (elementStyles[prop] !== undefined) {
        merged[prop] = elementStyles[prop];
      }
    });

    return merged;
  }

  _addParentViewbox(children, viewBox) {
    children.forEach((child) => {
      child.viewBox = viewBox;
      if (child.children && child.children.length > 0) {
        this._addParentViewbox(child.children, viewBox);
      }
    });
  }

  _preParse(children, inheritedStyles = {}) {
    if (!children || children.length === 0) return [];

    this._addParentViewbox(children, this.viewBox);

    this._checkForTransforms(children, inheritedStyles);

    const parsedChildren = children.map((child) =>
      this._elementToCommands(child, inheritedStyles)
    );

    if (this.options.flattenTransforms || this.options.flattenShapes) {
      return this._flattenShapesOrTransforms(parsedChildren);
    }

    return parsedChildren;
  }

  /**
   * Check if any element has transform operations and warn if none found
   * @param {Array} elements - Array of SVG elements to check
   * @param {Object} inheritedStyles - Inherited styles from parent elements
   * @returns {boolean} True if any element has transforms, false otherwise
   */
  _checkForTransforms(elements, inheritedStyles = {}) {
    let hasTransforms = false;

    const checkElement = (element) => {
      if (!element) return;

      const props = element.properties || {};
      const elementStyles = preprocessStyles(props);
      const styles = this._mergeStyles(inheritedStyles, elementStyles);

      if (styles.transform && styles.transform.length > 0) {
        hasTransforms = true;
      }

      if (element.children && element.children.length > 0) {
        const childHasTransforms = this._checkForTransforms(
          element.children,
          styles
        );
        hasTransforms = hasTransforms || childHasTransforms;
      }
    };

    elements.forEach(checkElement);

    if (!hasTransforms) {
      console.warn(
        "flattenTransforms is active but no SVG elements with transform operations found"
      );
    }

    return hasTransforms;
  }

  /**
   * Flattens only shapes with transforms or all shapes (if flattenShapes is true).
   * Groups are preserved and processed recursively. Elements without transforms are kept unchanged unless flattenShapes is true.
   * @param {Array} elements - Array of parsed SVG elements
   * @returns {Array} Array of processed elements (flattened where needed, groups preserved)
   */
  _flattenShapesOrTransforms(elements) {
    const processedElements = [];

    const processElement = (element) => {
      if (!element) return;

      if (element.type === "group" && element.children) {
        const processedChildren = this._flattenShapesOrTransforms(
          element.children
        );
        if (processedChildren.length > 0) {
          processedElements.push({
            ...element,
            children: processedChildren,
          });
        }
      } else {
        if (
          (element.styles &&
            element.styles.transform &&
            element.styles.transform.length > 0) ||
          this.options.flattenShapes
        ) {
          const flattened = flattenTransforms(element);
          if (flattened.commands && flattened.commands.length > 0) {
            processedElements.push({
              type: "path",
              commands: flattened.commands,
              styles: flattened.styles || element.styles || {},
              originalType: element.type,
              //bounds: element.bounds,
              viewBox: element.viewBox,
            });
          }
        } else {
          processedElements.push(element);
        }
      }
    };

    elements.forEach(processElement);
    return processedElements;
  }

  _elementToCommands(element, inheritedStyles = {}) {
    const props = element.properties || {};
    const children = element.children || [];

    const elementStyles = preprocessStyles(props);
    const styles = this._mergeStyles(inheritedStyles, elementStyles);

    // Parse element based on type
    let commands = [];
    let elementType = "";

    try {
      switch (element.tagName) {
        case "path":
          elementType = "path";
          commands = parsePath(props.d, this.options.convertLines);
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
          const childCommands = this._preParse(children, styles);
          return {
            type: elementType,
            styles: styles,
            children: childCommands,
            viewBox: element.viewBox,
          };

        default:
          console.warn(`Unknown SVG element type: ${element.tagName}`);
          return null;
      }
    } catch (error) {
      console.error(`Error parsing SVG element ${element.tagName}:`, error);
      return null;
    }

    return {
      type: elementType,
      commands: commands,
      styles: styles,
      viewBox: element.viewBox,
    };
  }

  _validateOptions() {
    if (
      this.options.flattenShapes &&
      (this.options.flattenTransforms || this.options.convertLines)
    ) {
      const redundant = [];
      if (this.options.flattenTransforms) redundant.push("flattenTransforms");
      if (this.options.convertLines) redundant.push("convertLines");

      console.warn(
        `SVG Loader: ${redundant.join(" and ")} ${
          redundant.length > 1 ? "are" : "is"
        } redundant when flattenShapes is true. ` +
          `flattenShapes already includes this functionality.`
      );
    }
  }
}
