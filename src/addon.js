/**
 * Main P5.js addon registration for p5-svg-loader
 */

import { SVG } from "./core/SVG.js";
import { drawNode } from "./drawing/draw-orchestrator.js";
import { drawDebugNode } from "./debug/debug-drawing.js";

// Shared utility functions to avoid duplication
function createDrawSVG() {
  return function (
    svgData,
    x,
    y,
    width = svgData.width,
    height = svgData.height,
    options = {
      ignoreStyles: false,
    }
  ) {
    const effectiveViewBox = svgData.viewBox || svgData._parentSVG.viewBox;
    const scaleX = width / effectiveViewBox.width;
    const scaleY = height / effectiveViewBox.height;

    this.push();
    this.translate(x, y);

    drawNode(this, svgData, effectiveViewBox, scaleX, scaleY, options);

    this.pop();
  };
}

function createDrawSVGDebug() {
  return function (svgData, x, y, width, height) {
    const effectiveViewBox = svgData.viewBox || svgData._parentSVG.viewBox;
    const scaleX = width / effectiveViewBox.width;
    const scaleY = height / effectiveViewBox.height;

    this.push();
    this.translate(x, y);

    // Draw bounding boxes for all elements
    drawDebugNode(this, svgData, effectiveViewBox, scaleX, scaleY);

    this.pop();
  };
}

// P5.js 2.0 addon definition
export const p5SvgLoaderAddon = function (p5, fn, lifecycles) {
  // Register SVG class
  p5.prototype.SVG = SVG;

  // Main SVG loader function
  fn.loadSVG = async function (filename, callback) {
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

  fn.drawSVG = createDrawSVG();
  fn.drawSVGDebug = createDrawSVGDebug();

  // Lifecycle hooks
  lifecycles.presetup = function () {
    console.log("⚙️ p5-svg-loader initialized");
  };
};

// Legacy P5.js 1.x compatibility
export function createLegacyCompatibility(p5) {
  console.warn(
    "p5-svg-loader: P5.js 2.0 addon system not available, falling back to 1.x compatibility"
  );

  // Register SVG class
  p5.prototype.SVG = SVG;

  // Fixed P5.js 1.x loadSVG function
  p5.prototype.loadSVG = function (filename, callback) {
    let result = {};

    fetch(filename)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then((svgContent) => {
        try {
          const svgObject = new this.SVG(svgContent);
          Object.assign(result, svgObject);

          if (callback) {
            callback(result);
          }
        } catch (error) {
          console.error("Error parsing SVG:", error);
        }
        this._decrementPreload();
      })
      .catch((error) => {
        console.error("Error loading SVG:", error);
        this._decrementPreload();
      });

    return result;
  };

  // Register for preload functionality in P5.js 1.x
  if (p5.prototype.registerPreloadMethod) {
    p5.prototype.registerPreloadMethod("loadSVG", p5.prototype);
  }

  p5.prototype.drawSVG = createDrawSVG();
  p5.prototype.drawSVGDebug = createDrawSVGDebug();

  // Legacy lifecycle hooks
  if (p5.prototype.registerMethod) {
    p5.prototype.svgLoaderInit = function () {
      console.log("p5-svg-loader initialized (legacy mode)");
    };
    p5.prototype.registerMethod("init", p5.prototype.svgLoaderInit);
  }
}
