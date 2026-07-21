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

    // p.drawSVG(mySVG, 0, 0, w, h);
    p.drawSVGDebug(mySVG, 0, 0, w, h, {
      elementBoundingBoxes: {
        show: true,
        stroke: "#ff0000",
        strokeWeight: 1,
        fill: "#ff0000",
        fillOpacity: 0.05,
        padding: 0,
        cornerShape: function (x, y) {
          this.fill("#ff0000");
          this.noStroke();
          this.rectMode(this.CENTER);
          this.rect(x, y, 6, 6);
        },
      },
      groupBoundingBoxes: {
        show: true,
        stroke: "#0000ff",
        strokeWeight: 1,
        fill: "#0000ff",
        fillOpacity: 0.04,
        padding: 4,
        cornerShape: function (x, y) {
          this.fill("#0000ff");
          this.noStroke();
          this.circle(x, y, 8);
        },
      },
      transformedGroupBoundingBoxes: {
        show: true,
        stroke: "#008000",
        strokeWeight: 1,
        fill: "#008000",
        fillOpacity: 0.03,
        padding: 10,
        cornerShape: function (x, y) {
          this.fill("#008000");
          this.noStroke();
          this.triangle(x, y - 5, x - 5, y + 4, x + 5, y + 4);
        },
      },
      shape: {
        show: true,
        stroke: 150,
        strokeWeight: 1,
      },
      shapePoint: {
        show: true,
        stroke: "#008FE9",
        strokeWeight: 1,
        fill: 255,
        fillOpacity: 1,
        customShape: function (x, y) {
          this.fill(255);
          this.stroke("#008FE9");
          this.strokeWeight(1);
          this.ellipse(x, y, 10, 10);
        },
      },
      shapeBezier: {
        show: true,
        stroke: "#E94900",
        strokeWeight: 1,
        fill: "#ffffff",
        fillOpacity: 1,
        customShape: function (x, y) {
          this.fill("#E94900");
          this.noStroke();
          this.push();
          this.translate(x, y);
          this.rotate(this.PI / 4);
          this.rectMode(this.CENTER);
          this.rect(0, 0, 6, 6);
          this.pop();
        },
      },
    });
  };
};

new p5(sketchInstance);
