/**
 * p5-svg-loader.js
 * A P5.js add-on library for loading and manipulating SVG files.
 * 
 * @version 0.0.1
 * @author Olivier Estévez
 * @license MIT
 */

import { parse } from "svg-parser";

(function() {
  'use strict';

  // P5.js 2.0 addon definition
  const p5SvgLoaderAddon = function (p5, fn, lifecycles) {
    
    p5.prototype.SVG = class {
      constructor(svgString) {
        this.raw = svgString.toString();
        this.parsed = parse(svgString);
        this.svg = this.parsed.children[0];
        this.width = parseFloat(this.svg.properties.width) || 100;
        this.height = parseFloat(this.svg.properties.height) || 100;
        this.viewBox = this._parseViewBox(this.svg.properties.viewBox);
        
        this.points = []
        this.children = []
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

      getChild(name) { /* ... */ }

      points(name) { /* ... */ }
    };

    // Main SVG loader function
    fn.loadSVG = async function(filename, callback) {
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


    fn.drawSVG = function (svgData, x, y, width = svgData.width, height = svgData.height) {
      const scaleX = width / svgData.viewBox.width;
      const scaleY = height / svgData.viewBox.height;

      this.push();
      this.translate(x, y);

      drawNode(this, svgData.svg, svgData.viewBox, scaleX, scaleY);

      this.pop();
    };

    fn.drawSVGDebug = function (svgData, x, y, width, height) {
      // ...
    };

    // Helper functions
    function transformCoord(x, y, viewBox, scaleX, scaleY) {
      return {
        x: (x - viewBox.x) * scaleX,
        y: (y - viewBox.y) * scaleY
      };
    }

    function drawNode(p, node, viewBox, scaleX, scaleY) {
      if (!node || !node.children) return;
      
      // Process this node if it's a shape
      if (node.tagName && node.tagName !== 'svg') {
        drawShape(p, node, viewBox, scaleX, scaleY);
      }

      // Process children recursively
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => drawNode(p, child, viewBox, scaleX, scaleY));
      }
    };

    function drawShape(p, node, viewBox, scaleX, scaleY) {
      const props = node.properties || {};

      // Set styles
      //applyStyles(p, props);

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
          drawText(p, props, viewBox, scaleX, scaleY);
          break;
      }
    }

    function drawPath(p, d, viewBox, scaleX, scaleY) {
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
    }

    function drawPolygon(p, props, viewBox, scaleX, scaleY) {
    }

    function drawText(p, props, viewBox, scaleX, scaleY) {
    }

    function applyStyles(p, props) {
    // Set fill
    if (props.fill === "none") {
      p.noFill();
    } else if (props.fill) {
      p.fill(props.fill);
    }

    // Set stroke
    if (props.stroke === "none") {
      p.noStroke();
    } else if (props.stroke) {
      p.stroke(props.stroke);
    }

    // Set stroke width
    if (props["stroke-width"]) {
      p.strokeWeight(parseFloat(props["stroke-width"]));
    }

    // More style properties can be added here (opacity, etc.)
  }

    // Lifecycle hooks
    lifecycles.presetup = function() {
      console.log('⚙️ p5-svg-loader initialized');
    };
  };

  // Register the addon with P5.js 2.0
  if (typeof p5 !== 'undefined' && p5.registerAddon) {
    p5.registerAddon(p5SvgLoaderAddon);
  } else {
    // Fallback for P5.js 1.x compatibility
    console.warn('p5-svg-loader: P5.js 2.0 addon system not available, falling back to 1.x compatibility');
    
    // Legacy P5.js 1.x support
    p5.prototype.loadSVG = function(filename, callback) {
      console.log(`Loading SVG file: ${filename}`);
      
      const result = {
        data: null,
        error: null,
        filename: filename
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
      p5.prototype.registerPreloadMethod('loadSVG', p5.prototype);
    }

    p5.prototype.drawSVG = function(svgData, x, y, width, height) {
      this.fill(255, 0, 0);
      this.noStroke();
      this.rect(x, y, width, height);
    };

    // Legacy lifecycle hooks
    if (p5.prototype.registerMethod) {
      p5.prototype.svgLoaderInit = function() {
        console.log('p5-svg-loader initialized (legacy mode)');
      };
      p5.prototype.registerMethod('init', p5.prototype.svgLoaderInit);
    }
  }

  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = p5;
  }
})();