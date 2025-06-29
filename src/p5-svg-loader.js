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
      this.scale(scaleX, scaleY);
      this.translate(-svgData.viewBox.x, -svgData.viewBox.y);

      drawNode(this, svgData.svg);

      this.pop();
    };

    fn.drawSVGDebug = function (svgData, x, y, width, height) {
      // ...
    };

    // Helper functions
    function drawNode(p, node) {
      if (!node || !node.children) return;
      
      // Process this node if it's a shape
      if (node.tagName && node.tagName !== 'svg') {
        drawShape(p, node);
      }

      // Process children recursively
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => drawNode(p, child));
      }
    };

    function drawShape(p, node) {
      const props = node.properties || {};

      // Set styles
      applyStyles(p, props);

      switch (node.tagName) {
        case "path":
          drawPath(p, props.d);
          break;
        case "rect":
          drawRect(p, props);
          break;
        case "circle":
          drawCircle(p, props);
          break;
        case "ellipse":
          drawEllipse(p, props);
          break;
        case "line":
          drawLine(p, props);
          break;
        case "polyline":
          drawPolyline(p, props);
          break;
        case "polygon":
          drawPolygon(p, props);
          break;
        case "text":
          drawText(p, props);
          break;
      }
    }

    function drawPath(p, props) {
    }

    function drawRect(p, props) {
    }

    function drawCircle(p, d) {
      const cx = parseFloat(d.cx) || 0;
      const cy = parseFloat(d.cy) || 0;
      const r = parseFloat(d.r) || 0;

      p.ellipse(cx, cy, r * 2, r * 2);
    }

    function drawEllipse(p, props) {
    }

    function drawLine(p, props) {
    }

    function drawPolyline(p, props) {
    }

    function drawPolygon(p, props) {
    }

    function drawText(p, props) {
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