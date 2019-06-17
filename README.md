# rollup-plugin-copy-imported-assets

Copies non-js assets that are imported using ES syntax.
That means that the assets need to be transpiled/converted later in another build

## Why ?
Providing ES modules in libraries is a good practice to enable treeshaking.
CSS threeshaking, on the other hand, is something not commonly used. When
using css modules, it is something that could be accomplished.

This plugin provides a way to "ignore" imported css modules (assets) and copy
them so they accessible by a generated bundle. The library consumers need to
process such assets in their own way. They might, for example, use a different
settings for `autoprefixer` to target clients browsers for their specific use case.

## Installation

```bash
npm install --save-dev rollup-plugin-copy-imported-assets
```

## Usage

```js
// rollup.config.js
import copyAssets from 'rollup-plugin-copy-imported-assets';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
    assetFileNames: 'assets/[name]-[hash][extname]',

  },

  plugins: [
    copyAssets({
      include: /\.sass/,
    })
  ]
};
```

### Input
```js
// src/main.js
import css from 'styles.sass'

export default () => // component using css variable
```

### Output
```js
// dist/bundle.js
import css from 'assets/styles-hashfoobar.sass'

export default () => // component using css variable
```

In conlusion, the source has to be processed with another bundler again

## License

MIT