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
        this.parsed = parse(svgString);
        this.svg = this.parsed.children[0];
        this.width = parseFloat(this.svg.properties.width) || 100;
        this.height = parseFloat(this.svg.properties.height) || 100;
        // this.viewBox = this.parseViewBox(this.svg.properties.viewBox);

        this.x = 20
        this.y = 20
        
        this.points = []
        this.children = []
      }
      
      getChild(name) { /* ... */ }

      points(name) { /* ... */ }
    };

    // Main SVG loader function
    fn.loadSVG = async function(filename, callback) {
      const svgString = fetch(filename)
      .then(response => response.text())
      .catch(error => {
        console.error('Error loading SVG:', error);
      });
      const svgContent = await svgString;
      const result_1 = new this.SVG(svgContent);
      if (callback) {
        callback(result_1);
      }
      return result_1;
    };


    fn.drawSVG = function (svgData, x, y, width, height) {
      this.fill(255, 0, 0);
      this.noStroke();
      this.rect(x, y, width, height);
    };

    fn.drawSVGDebug = function (svgData, x, y, width, height) {
      // ...
    };

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