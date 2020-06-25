# `troika-three-text`

This package provides high quality text rendering in [Three.js](https://threejs.org) scenes, using signed distance fields (SDF) and antialiasing using standard derivatives.

Rather than relying on pre-generated SDF textures, this parses font files (.ttf, .otf, .woff) directly using [Typr.js](https://github.com/photopea/Typr.js), and generates the SDF atlas for glyphs on-the-fly as they are used. It also handles proper kerning and ligature glyph substitution. All font parsing, SDF generation, and glyph layout is performed in a web worker to prevent frame drops.

Once the SDFs are generated, it assembles a geometry that positions all the glyphs, and _patches_ any Three.js Material with the proper shader code for rendering the SDFs. This means you can still benefit from all the features of Three.js's built-in materials like lighting, physically-based rendering, shadows, and fog.

## Demos

* [With the Troika scene management framework](https://troika-examples.netlify.com/#text)
* [With react-three-fiber](https://codesandbox.io/embed/troika-3d-text-via-react-three-fiber-ntfx2?fontsize=14)

## With Other Frameworks

* [In the `drei` utilities for react-three-fiber](https://github.com/react-spring/drei#%EF%B8%8F-text-)
* [As an A-Frame component](https://github.com/lojjic/aframe-troika-text)


## Screenshots

![Text Rendering](./screenshot1.png)

![Zoomed-in](./screenshot2.png)

![Font with ligatures](./screenshot3.png)

![Text with a texture](./screenshot4.png)

## Installation

Get it from [NPM](https://www.npmjs.com/package/troika-three-text):

```sh
npm install troika-three-text
```

You will also need to install a compatible version of [Three.js](https://threejs.org); see the notes in the [Troika 3D Readme](../troika-3d/README.md#installation) for details.

## Usage

```js
import {Text} from 'troika-three-text'
````

You can then use the `Text` class like any other Three.js mesh:

```js
// Create:
const myText = new Text()
myScene.add(myText)

// Set properties to configure:
myText.text = 'Hello world!'
myText.fontSize = 0.2
myText.position.z = -2
myText.color = 0x9966FF

// Update the rendering:
myText.sync()
```

It's a good idea to call the `.sync()` method after changing any properties that would affect the text's layout. If you don't, it will be called automatically on the next render frame, but calling it yourself can get the result sooner.

When you're done with the `Text` instance, be sure to call `dispose` on it to prevent a memory leak:

```js
myScene.remove(myText)
myText.dispose()
```

## Supported properties

Instances of `Text` support the following configuration properties:

#### `text`

The string of text to be rendered. Newlines and repeating whitespace characters are honored.

Default: _none_

#### `anchor`

This property is deprecated as of version 0.24.0; use `anchorX` and `anchorY` instead.

#### `anchorX`

Defines the horizontal position in the text block that should line up with the local origin. Can be specified as a numeric `x` position in local units, a string percentage of the total text block width e.g. `'25%'`, or one of the following keyword strings: `'left'`, `'center'`, or `'right'`.

Default: `0`

#### `anchorY`

Defines the vertical position in the text block that should line up with the local origin. Can be specified as a numeric `y` position in local units (note: down is negative y), a string percentage of the total text block height e.g. `'25%'`, or one of the following keyword strings: `'top'`, `'top-baseline'`, `'middle'`, `'bottom-baseline'`, or `'bottom'`.

Default: `0`

#### `clipRect`

If specified, defines the `[minX, minY, maxX, maxY]` of a rectangle outside of which all pixels will be discarded. This can be used for example to clip overflowing text when `whiteSpace='nowrap'`.

Default: _none_

#### `color`

This is a shortcut for setting the `color` of the text's `material`. You can use this if you don't want to specify a whole custom `material` and just want to change its color.

Use the `material` property if you want to control aspects of the material other than its color.

Default: _none_ - uses the color of the `material`

#### `depthOffset`

This is a shortcut for setting the material's [`polygonOffset` and related properties](https://threejs.org/docs/#api/en/materials/Material.polygonOffset), which can be useful in preventing z-fighting when this text is laid on top of another plane in the scene. Positive numbers are further from the camera, negatives closer.

Be aware that while this can help with z-fighting, it does not affect the rendering order; if the text renders before the content behind it, you may see antialiasing pixels that appear too dark or light. You may need to also change the text mesh's `renderOrder`, or set its `z` position a fraction closer to the camera, to ensure the text renders after background objects.

Default: `0`

#### `font`

The URL of a custom font file to be used. Supported font formats are:
* .ttf
* .otf
* .woff (.woff2 is _not_ supported)

Default: The *Roboto* font loaded from Google Fonts CDN

#### `fontSize`

The em-height at which to render the font, in local world units.

Default: `0.1`

#### `glyphGeometryDetail`

The number of vertical/horizontal segments that make up each glyph's rectangular plane. This can be increased to provide more geometrical detail for custom vertex shader effects, for example.

Default: `1`

#### `letterSpacing`

Sets a uniform adjustment to spacing between letters after kerning is applied, in local world units. Positive numbers increase spacing and negative numbers decrease it.

Default: `0`

#### `lineHeight`

Sets the height of each line of text. Can either be `'normal'` which chooses a reasonable height based on the chosen font's ascender/descender metrics, or a number that is interpreted as a multiple of the `fontSize`.

Default: `'normal'`

#### `material`

Defines a Three.js Material _instance_ to be used as a base when rendering the text. This material will be automatically replaced with a new material derived from it, that adds shader code to decrease the alpha for each fragment (pixel) outside the text glyphs, with antialiasing.

By default it will derive from a simple white `MeshBasicMaterial, but you can use any of the other mesh materials to gain other features like lighting, texture maps, etc.

Also see the `color` shortcut property.

Default: a `MeshBasicMaterial` instance

#### `maxWidth`

The maximum width of the text block, above which text may start wrapping according to the `whiteSpace` and `overflowWrap` properties.

Default: `Infinity`, meaning text will never wrap

#### `overflowWrap`

Defines how text wraps if the `whiteSpace` property is `'normal'`. Can be either `'normal'` to break at whitespace characters, or `'break-word'` to allow breaking within words.

Default: `'normal'`

#### `sdfGlyphSize`

Allows overriding the default size of each glyph's SDF (signed distance field) used when rendering this text instance. This must be a power-of-two number. Larger sizes can improve the quality of glyph rendering by increasing the sharpness of corners and preventing loss of very thin lines, at the expense of increased memory footprint and longer SDF generation time.

Default: `64`

#### `textAlign`

The horizontal alignment of each line of text within the overall text bounding box. Can be one of `'left'`, `'right'`, `'center'`, or `'justify'`.

Default: `'left'`

#### `whiteSpace`

Defines whether text should wrap when a line reaches the `maxWidth`. Can be either `'normal'`, to allow wrapping according to the `overflowWrap` property, or `'nowrap'` to prevent wrapping.

Note that `'normal'` in this context _does_ honor newline characters to manually break lines, making it behave more like `'pre-wrap'` does in CSS.

Default: `'normal'`


## Preloading

To avoid long pauses when first displaying a piece of text in your scene, you can preload fonts and optionally pre-generate the SDF textures for particular glyphs up front:

```js
import {preloadFont} from 'troika-three-text'

myApp.showLoadingScreen()

preloadFont(
  {
    font: 'path/to/myfontfile.woff', 
    characters: 'abcdefghijklmnopqrstuvwxyz'
  },
  () => {
    myApp.showScene()
  }
)
```

The arguments are:

- `options`
  
  - `options.font` - The URL of the font file to preload. If `null` is passed, this will preload the default font.
  
  - `options.characters` - A string or array of string character sequences for which to pre-generate glyph SDF textures. Note that this _will_ honor ligature substitution, so you may need to specify ligature sequences in addition to their individual characters to get all possible glyphs, e.g. `["t", "h", "th"]` to get the "t" and "h" glyphs plus the "th" glyph.

  - `options.sdfGlyphSize` - The size at which to prerender the SDFs for the `characters` glyphs. See the `sdfGlyphSize` config property on `Text` for details about SDF sizes. If not specified, will use the default SDF size.

- `callback` - A function that will be called when the preloading is complete.


## Carets and Selection Ranges

In addition to rendering text, it is possible to access positioning information for caret placement and selection ranges. To access that info, use the `getCaretAtPoint` and `getSelectionRects` utility functions. Both of these functions take a `textRenderInfo` object as input, which you can get from the `Text` object either in the `sync()` callback or from its `textRenderInfo` property after sync has completed.

#### `getCaretAtPoint(textRenderInfo, x, y)`

This returns the caret position nearest to a given x/y position in the local text plane. This is useful for placing an editing caret based on a click or ther raycasted event. The return value is an object with the following properties:

- `x` - x position of the caret
- `y` - y position of the caret's bottom
- `height` - height of the caret, based on the current fontSize and lineHeight
- `charIndex` - the index in the original input string of this caret's target character. The caret will be for the position _before_ that character. For the final caret position, this will be equal to the string length. For ligature glyphs, this will be for the first character in the ligature sequence.

#### `getSelectionRects(textRenderInfo, start, end)`

This returns a list of rectangles covering all the characters within a given character range. This is useful for highlighting a selection range. The return value is an array of objects, each with `{left, top, right, bottom}` properties in the local text plane.