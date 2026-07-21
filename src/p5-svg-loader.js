/**
 * p5-svg-loader.js
 * A p5.js add-on library for loading and displaying SVG files.
 *
 * @version 0.1.0
 * @author Olivier Estévez
 * @license MIT
 */

import { p5SvgLoaderAddon, createLegacyCompatibility } from "./addon.js";

if (typeof p5 !== "undefined") {
  if (p5.registerAddon) {
    p5.registerAddon(p5SvgLoaderAddon);
  } else {
    createLegacyCompatibility(p5);
  }
} else if (typeof window !== "undefined") {
  console.error("p5-svg-loader: p5.js should be loaded before p5-svg-loader");
}
export default p5SvgLoaderAddon;
