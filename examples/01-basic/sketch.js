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

    p.background(240);

    p.stroke(200);
    p.strokeWeight(0.5);

    for (let x = 0; x <= p.width; x += 10) {
      p.line(x, 0, x, p.height);
      if (x % 50 === 0) {
        p.noStroke();
        p.fill(100);
        p.textSize(10);
        p.text(x, x + 2, 15);
        p.stroke(200);
      }
    }

    for (let y = 0; y <= p.height; y += 10) {
      p.line(0, y, p.width, y);
      if (y % 50 === 0) {
        p.noStroke();
        p.fill(100);
        p.textSize(10);
        p.text(y, 2, y - 5);
        p.stroke(200);
      }
    }

    const w = mySVG.width * 4;
    const h = mySVG.height * 4;
    p.drawSVG(mySVG, 0, 0, w, h, {
      ignoreStyles: false,
    });
    p.drawSVGDebug(mySVG, 0, 0, w, h);
  };
};

new p5(sketchInstance);
