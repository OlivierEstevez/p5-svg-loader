# p5-svg-loader

A P5.js add-on library for loading and manipulating SVG files.


## loadSVG

`loadSVG` returns a new `p5.SVG`object

p5.js 1.x:
```
p.preload = function () {
  mySVG = p.loadSVG('sample.svg');
};
```

p5.js 2.x
```
mySVG = await p.loadSVG('sample.svg');
```

## drawSVG
```
p.drawSVG(mySVG, 0, 0, mySVG.width, mySVG.height);
```

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

### Access Children

```
mySVG.getChild('layerName')
```

```
p.drawSVG(mySVG.children[0], 0, 0, mySVG.children[0].width, mySVG.children[0].height);
```

### Point access

```
mySVG.points.forEach(point => {
  point.x += 100;
  point.y += 100;
});
```

### Extra

```
p.rectMode(p.CENTER);
```