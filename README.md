# p5-svg-loader

A P5.js add-on library for loading and manipulating SVG files.

## loadSVG

`loadSVG` returns a new `p5.SVG`object

⚠️ To-do: Explain what this function does and why is it a good practice putting it on the `setup()` function

⚠️ To-do: Input data (SVG file only? string?)

Options:

- convertLines (⚠️ to-do)

### p5.js 1.x:

```
function preload() {
  const mySVG = loadSVG('sample.svg');
}
```

### p5.js 2.x

```
async function setup(){
mySVG = await loadSVG('sample.svg');

}
```

## drawSVG

⚠️ To-do: Explain what the function does, parameters (x, y, w, h, options)

⚠️ options

- ignoreStyles
- ignoreParentViewbox (⚠️ to-do)

```
drawSVG(mySVG, 0, 0, mySVG.width, mySVG.height);
```

⚠️ Draw children

```
// Get child by id (if the element has an id attribute)
const specificElement = mySVG.getChild("myElementId");
```

If multiple, it can return an array, which will work on drawSVG()

⚠️ To-do: Explain how colors work and how to override them
Override colors (fill & stroke)

## Debug

```
p.drawSVGDebug(mySVG, {
  stroke: "#0000ff",
  handleShape: (x, y) => {
    p.push();
    p.translate(x, y);
    p.fill(255, 0, 0);
    p.rect(x, y, 10, 10);
    p.pop();
  },
  groupBoxes: true,
});
```

## `p5.SVG` object

The parsedSVG object contains all the point data need to be drawn, and a set of useful functions.

### ⚠️ Point access (WIP)

```
mySVG.points.forEach(point => {
  point.x += 100;
  point.y += 100;
});
```

### ⚠️ Extra (WIP)

```
p.rectMode(p.CENTER);
```
