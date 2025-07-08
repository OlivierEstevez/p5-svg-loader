/**
 * Main P5.js addon registration for p5-svg-loader
 */

import { SVG } from "./core/SVG.js";
import { drawNode } from "./drawing/draw-orchestrator.js";
import { drawDebugNode } from "./debug/debug-drawing.js";

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

  fn.drawSVG = function (
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

  fn.drawSVGDebug = function (svgData, x, y, width, height) {
    const effectiveViewBox = svgData.viewBox || svgData._parentSVG.viewBox;
    const scaleX = width / effectiveViewBox.width;
    const scaleY = height / effectiveViewBox.height;

    this.push();
    this.translate(x, y);

    // Draw bounding boxes for all elements
    drawDebugNode(this, svgData, effectiveViewBox, scaleX, scaleY);

    this.pop();
  };

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

  // Legacy P5.js 1.x support
  p5.prototype.loadSVG = function (filename, callback) {
    console.log(`Loading SVG file: ${filename}`);

    const result = {
      data: null,
      error: null,
      filename: filename,
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
    p5.prototype.registerPreloadMethod("loadSVG", p5.prototype);
  }

  p5.prototype.drawSVG = function (svgData, x, y, width, height) {
    this.fill(255, 0, 0);
    this.noStroke();
    this.rect(x, y, width, height);
  };

  // Legacy lifecycle hooks
  if (p5.prototype.registerMethod) {
    p5.prototype.svgLoaderInit = function () {
      console.log("p5-svg-loader initialized (legacy mode)");
    };
    p5.prototype.registerMethod("init", p5.prototype.svgLoaderInit);
  }
}
