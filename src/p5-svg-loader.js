/**
 * p5-svg-loader.js
 * A P5.js add-on library for loading and manipulating SVG files.
 *
 * @version 0.0.1
 * @author Olivier Estévez
 * @license MIT
 */

import { p5SvgLoaderAddon, createLegacyCompatibility } from "./addon.js";

(function () {
  "use strict";

  // Register the addon with P5.js 2.0
  if (typeof p5 !== "undefined" && p5.registerAddon) {
    p5.registerAddon(p5SvgLoaderAddon);
  } else {
    // Fallback for P5.js 1.x compatibility
    createLegacyCompatibility(p5);
  }

  // Export for module systems
  if (typeof module !== "undefined" && module.exports) {
    module.exports = p5;
  }
})();
