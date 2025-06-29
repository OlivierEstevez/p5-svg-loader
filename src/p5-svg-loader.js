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


    fn.drawSVG = function (svgData, x, y, width, height) {
      const scaleX = (width !== null ? width : svgData.width) / svgData.viewBox.width;
      const scaleY =
        (height !== null ? height : svgData.height) / svgData.viewBox.height;

      this.push();
      this.translate(x, y);
      this.scale(scaleX, scaleY);
      this.translate(-svgData.viewBox.x, -svgData.viewBox.y);

      drawNode(svgData.svg);

      this.pop();
    };

    fn.drawSVGDebug = function (svgData, x, y, width, height) {
      // ...
    };

    // Helper functions
    function drawNode(node) {
      if (!node || !node.children) return;

      // Process this node if it's a shape
      if (node.tagName && node.tagName !== 'svg') {
        drawShape(node);
      }

      // Process children recursively
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => drawNode(child));
      }
    };

    function drawShape(node) {
      const props = node.properties || {};

      // Set styles
      // this.applyStyles(p, props);

      switch (node.tagName) {
        case "path":
          drawPath(props.d);
          break;
        case "rect":
          drawRect(props);
          break;
        case "circle":
          drawCircle(props);
          break;
        case "ellipse":
          drawEllipse(props);
          break;
        case "line":
          drawLine(props);
          break;
        case "polyline":
          drawPolyline(props);
          break;
        case "polygon":
          drawPolygon(props);
          break;
      }
    }

    function drawPath(d) {
    }

    function drawRect(d) {
    }

    function drawCircle(d) {
    }

    function drawEllipse(d) {
    }

    function drawLine(d) {
    }

    function drawPolyline(d) {
    }

    function drawPolygon(d) {
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