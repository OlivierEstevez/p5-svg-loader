import "../../dist/p5-svg-loader.esm.js";

let mySVG;

const sketchInstance = (p) => {
  p.preload = function () {
    mySVG = p.loadSVG("../sample.svg", (e) => {
      console.log("SVG loaded:", e);
    });
  };

  p.setup = async function () {
    const canvas = p.createCanvas(1200, 1200);
    canvas.parent("sketch-container");

    p.background(255);

    const w = mySVG.width * 4;
    const h = mySVG.height * 4;

    p.drawSVG(mySVG, 0, 0, w, h);
    p.drawSVGDebug(mySVG, 0, 0, w, h);
  };
};

new p5(sketchInstance);
