![](docs/banner.png)

# p5 SVG Loader

> A p5.js add-on library for loading and displaying SVG files.

> [!WARNING]
> This library is under development, and some features are Work In Progress

If you've ever tried to work with SVGs in p5.js, you've probably discovered that... you simply can't.

Yes, there's [p5.js-svg](https://github.com/zenozeng/p5.js-svg), but that converts the full sketch into an SVG, losing some p5.js capabilities. This library aims to solve that: it lets you load and display SVG's as p5 path data and access its properties.

[Try it now on p5.js Web Editor]() (⚠️ TO-DO) | [Explore the examples]() (⚠️ TO-DO)

## Features:

- Load and display SVG files as path data on p5.js sketches.
- Broad SVG properties support (including transforms). See [Supported properties](#supported-properties).
- Debug view with bounding box calculation.
- Access and modify path vector data.
- Choose how to display paths with an API similar to [Opentype.js](https://github.com/opentypejs/opentype.js). (⚠️ Add example ?)
- p5.js 1.x and 2.x compatible.
- Compatible with both Global and Instance modes.

# Installation

## Script file

Download the latest p5-svg-loader.min.js file from the [Releases](https://github.com/OlivierEstevez/p5-svg-loader/releases) section and place it in your project directory, or include it using a CDN like unpkg or jsdeliver. Add the script tag to the HTML file **after importing `p5.js`**:

```html
<!-- Import p5.js first -->
<script src="path/to/p5.min.js"></script>

<!-- Import p5-svg-loader locally  -->
<script src="p5-svg-loader.min.js"></script>

<!-- Or use a CDN  -->
<script src="https://cdn.jsdelivr.net/npm/p5-svg-loader.min.js@latest"></script>
(⚠️ TO-DO)
<script src="https://unpkg.com/p5-svg-loader.min.js@latest"></script>
(⚠️ TO-DO)
```

## NPM (⚠️ TO-DO)

```bash
npm install p5bezier
```

```javascript
import p5SVGLoader from "p5-svg-loader"; // (⚠️ TO-DO: Verify this)
```

## Importing the library

### Global Mode

```javascript
// p5.js 2.x Global Mode
let mySVG;

async function setup() {
  const canvas = createCanvas(600, 400);

  mySVG = await loadSVG("sample.svg");
  console.log("SVG loaded:", mySVG);
}

function draw() {
  p.background(255);
  p.drawSVG(mySVG, 0, 0, mySVG.width, mySVG.height);
}
```

### Instance Mode

The library functions are attached automatically to the `p5` global object, so you only need to import it.

```javascript
// p5.js 2.x Instance Mode
import p5 from "p5";
import p5SVGLoader from "p5-svg-loader"; // (⚠️ TO-DO: Verify this)

let mySVG;

const sketch = (p) => {
  p.setup = async () => {
    p.createCanvas(800, 800);

    mySVG = await p.loadSVG("./sample.svg");
    console.log("SVG loaded:", mySVG);
  };

  p.draw = () => {
    p.background(255);
    p.drawSVG(mySVG, 0, 0, mySVG.width, mySVG.height);
  };
};

new p5(sketch);
```

# Usage

## loadSVG

`loadSVG(SVG, options)`

Loads an SVG and returns a new `p5.SVG`object, which will be used to draw the shapes.

```javascript
// Load an SVG File
async function setup() {
  const mySVG = await loadSVG("sample.svg");
}

// Load an SVG as a string
async function setup() {
  const mySVG = await loadSVG(
    '<svg width="15" height="15" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg"><path d="M7.49991 ... 5.97498Z"></path></svg>'
  );
}
```

Depending on you p5.js version, use the method on preload or at setup:

```javascript
// p5.js 1.x:
function preload() {
  const mySVG = loadSVG("sample.svg");
}

// p5.js 2.x
async function setup() {
  const mySVG = await loadSVG("sample.svg");
}
```

### Options

An optional object can be passed to configure how the SVG is loaded.

| Option              | Type      | Default | Description                                               |
| ------------------- | --------- | ------- | --------------------------------------------------------- |
| `convertLines`      | `boolean` | `false` | Converts `H`, `h`, `V` and `v` commands to `L` commands   |
| `flattenTransforms` | `boolean` | `false` | Applies transform operations directly to path data        |
| `flattenShapes`     | `boolean` | `false` | Converts all shapes to paths and applies their transforms |

> [!WARNING] > `flattenShapes` applies `flattenTransforms` internally. Setting both to `true` will display a warning

```javascript
const mySVG = loadSVG("sample.svg", {
  convertLines: true,
  flattenTransforms: true,
  flattenShapes: true, // This includes flattenTransforms automatically
});
```

## drawSVG

`loadSVG(SVG, x, y, w, h, options)`

Draws the loaded SVG.

- `SVG`: Loaded `p5.SVG` object
- `x`: x position
- `y`: y position
- `w`: Width to be drawn. Can be manually specified, or draw the SVG's via: `mySVG.width`
- `h`: Height to be drawn. Can be manually specified, or draw the SVG's via: `mySVG.width`
- `options`: Optional object to configure how the SVG is displayed

### Options

An optional object can be passed to configure how the SVG is drawn.

| Option                           | Type      | Default | Description                                                                                                                 |
| -------------------------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ignoreStyles`                   | `boolean` | `false` | Ignores the SVG styles and draws it inheriting the p5 sketch ones                                                           |
| `ignoreParentViewbox` (⚠️ TO-DO) | `boolean` | `false` | When drawing individual children, ignores the parent viewBox and draws the element at the specified `x` and `y` coordinates |

```javascript
stroke(0)
fill(255, 0, 0)

drawSVG(mySVG, 0, 0, mySVG.width, mySVG.height. {
  ignoreStyles: true
});
```

### Draw individual children

You can draw specific SVG elements by accessing them through the `children` array:

```javascript
drawSVG(mySVG.children[2], 0, 0, mySVG.width, mySVG.height. {
  ignoreParentViewbox: true
});
```

## drawSVGDebug (⚠️ TO-DO)

`drawSVGDebug(SVG, options)`

Draws configurable debug data, like bounding boxes and bezier handles.

```javascript
// (⚠️ TO-DO)
// This is a proof of concept syntax
drawSVGDebug(mySVG, {
  stroke: "#0000ff",
  handleShape: (x, y) => {
    push();
    translate(x, y);
    fill(255, 0, 0);
    rect(x, y, 10, 10);
    pop();
  },
  groupBoxes: true,
});
```

## `p5.SVG` object

The `p5.SVG` object contains all the parsed data from the SVG:

**Root properties:**

- `width`: Width of the SVG
- `height`: Height of the SVG
- `viewBox`: SVG's viewBox
- `options`: Options passed via the `loadSVG` function
- `children`: An array of child elements (see structure below)

**Children properties:**

Each child in the `children` array represents an SVG element and contains:

- `type`: type of the SVG shape (`path`, `rect`, `ellipse`, etc)
- `commands`: Array of path commands
- `viewBox`: Main SVG viewBox
- `styles`: Inherited and applied styles from the SVG
- `children`: An array of child elements (recursive structure for nested groups and elements)

**Recursive structure:**

The `children` array can contain nested structures. For example, a `<g>` (group) element can contain other groups, paths, shapes, etc. Each child element follows the same structure, allowing for deep nesting that mirrors the original SVG hierarchy:

```javascript
mySVG.children[0].children[2].children[0]; // Access deeply nested elements
```

## Supported Properties

<table>
<tr><th>SVG Elements</th><th>SVG Properties</th></tr>
<tr><td valign="top">

| SVG Element  | Supported |
| ------------ | --------- |
| `<path>`     | ✅ Yes    |
| `<rect>`     | ✅ Yes    |
| `<circle>`   | ✅ Yes    |
| `<ellipse>`  | ✅ Yes    |
| `<line>`     | ✅ Yes    |
| `<polyline>` | ✅ Yes    |
| `<polygon>`  | ✅ Yes    |
| `<g>`        | ✅ Yes    |
| `<img>`      | ❌ No     |
| `<text>`     | ❌ No     |
| `<style>`    | ❌ No     |

</td><td valign="top">

| SVG Properties      | Supported |
| ------------------- | --------- |
| `opacity`           | ✅ Yes    |
| `fill-color`        | ✅ Yes    |
| `fill-opacity`      | ✅ Yes    |
| `fill-rule`         | ❌ No     |
| `stroke`            | ✅ Yes    |
| `stroke-width`      | ✅ Yes    |
| `stroke-linecap`    | ✅ Yes    |
| `stroke-linejoin`   | ✅ Yes    |
| `stroke-miterlimit` | ❌ No     |
| `stroke-dasharray`  | ✅ Yes    |
| `stroke-dashoffset` | ✅ Yes    |
| `transform`         | ✅ Yes    |

</td></tr>
</table>

### Not supported

The goal of this library is to support simple SVG vector graphics on p5.js sketches, so other SVG features like gradients, patterns, clipping / masking, filters, `def`'s, `use` and animations are not planned to be supported.

## Learn more

⚠️ TO-DO
