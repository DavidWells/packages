# PostCSS Math Plugin

Support advanced math via [mathjs](https://github.com/josdejong/mathjs)

This plug-in supports:

* Plain-old maths, as per math.js built-in functionality
* `px`, `em`, `rem`, `vh`, `vmax` and other units
* CSS-friendly rendering (`10cm` not `10 cm`)
* Unit stripping e.g. `strip(25px)` becomes `25`
* Unit math operations e.g. `floor(12.6px)` becomes `12px` and `ceil(12.6px)` becomes `13px`

Contributions are very welcome!

## Example usage

Input:

```css
.foo {
  /* Basic usage */
  font-size: resolve(2 * 8px);
  /* nested */
  margin: resolve(4px + resolve(2 * 3px));
  /* with postcss simple variables. $navHeight = 80px  */
  height: resolve($navHeight - 20px);
  /* strip values */
  padding: resolve(strip(16cm) * (2px + 3))px;
}
```

Output:

```css
.foo {
  font-size: 16px;
  padding: 22px;
  margin: 10px;
  height: 60px;
}
```

Multiline:

```css
p {
  font-size: resolve(
    1 +
    2 +
    3
  )px;
}
```

Output:

```css
p {
  font-size: 6px;
}
```

## Usage

```js
postcss([ require('@davidwells/postcss-math') ])
```

See [PostCSS] docs for examples for your environment.


## How does this differ to `postcss-calc` or CSS `calc()`?

They're (deliberately) trying to work towards the calc(...) standard, so for
instance it doesn't support things like exponentials at the moment. This wraps
up math.js so you have a wider range of things you can do.


## Prior art

Updated fork of https://github.com/shauns/postcss-math
