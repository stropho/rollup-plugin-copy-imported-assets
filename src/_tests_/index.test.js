
import babel from 'rollup-plugin-babel';
import { rollup } from 'rollup';
import copyImportedAssets from '../index';

const BABEL_OPTIONS = {
  babelrc: false,
  presets: [['@babel/preset-env', { modules: false }]],
  exclude: ['node_modules/**'],
};

const OUTPUT_OPTIONS = {
  file: 'output.js',
  format: 'esm',
};

describe('warnings', () => {
  it('warns about missing include/exclude options', async () => {
    const onwarnSpy = jest.fn();
    const inputOptions = {
      onwarn: onwarnSpy,
      input: 'src/_tests_/fixture/single-file/index.js',
      plugins: [
        copyImportedAssets(), // missing options !
        babel(BABEL_OPTIONS),
      ],
    };

    const bundle = await rollup(inputOptions);
    const { output } = await bundle.generate(OUTPUT_OPTIONS);

    expect(output.length).toBe(1);
    expect(onwarnSpy).toHaveBeenCalledTimes(1);
    expect(onwarnSpy.mock.calls[0][0].code).toBe('PLUGIN_WARNING');
    expect(onwarnSpy.mock.calls[0][0].message).toMatchSnapshot();
  });
  it('warns about unsupported output format', async () => {
    const onwarnSpy = jest.fn();
    const inputOptions = {
      onwarn: onwarnSpy,
      input: 'src/_tests_/fixture/single-file/index.js',
      plugins: [
        copyImportedAssets({ include: /.*/ }),
        babel(BABEL_OPTIONS),
      ],
    };

    const bundle = await rollup(inputOptions);
    const { output } = await bundle.generate({ ...OUTPUT_OPTIONS, format: 'commonjs' });

    expect(output.length).toBe(1);
    expect(onwarnSpy).toHaveBeenCalledTimes(1);
    expect(onwarnSpy.mock.calls[0][0].code).toBe('PLUGIN_WARNING');
    expect(onwarnSpy.mock.calls[0][0].message).toMatchSnapshot();
  });
});
describe('importing-asset', () => {
  it('generates esm output with external asset', async () => {
    const inputOptions = {
      input: 'src/_tests_/fixture/importing-asset/index.js',
      plugins: [
        copyImportedAssets({ include: /\.myext/ }),
        babel(BABEL_OPTIONS),
      ],
    };

    const bundle = await rollup(inputOptions);
    const { output } = await bundle.generate(OUTPUT_OPTIONS);

    expect(output.length).toBe(2);
    expect(output[0].imports.length).toBe(1);
    expect(output[0].code.includes('from \'./assets/asset-b7235ae7.myext\'')).toBeTruthy();

    expect(output[1].isAsset).toBeTruthy();
    expect(output[1].fileName.endsWith('/asset-b7235ae7.myext')).toBeTruthy();
  });
});

// describe('importing-asset-and-transforming', () => {
//   it('generates esm output with external css asset generated from other file', async () => {
//     const inputOptions = {
//       input: 'src/_tests_/fixture/importing-asset/index.js',
//       plugins: [
//         // {
//         //   resolveId(id, importer) {
//         //     // does not seem possible to transform files and send to next plugin
//         //   },
//         //   transform(code, id) {
//         //     // does not seem possible to transform files and send to next plugin
//         //   },
//         // },
//         copyImportedAssets({ include: /\.myext$/ }),
//         babel(BABEL_OPTIONS),
//       ],
//     };

//     const bundle = await rollup(inputOptions);
//     const { output } = await bundle.generate(OUTPUT_OPTIONS);

//     expect(output.length).toBe(2);
//     expect(output[0].imports.length).toBe(1);

//     expect(output[0].code.includes('from \'./assets/asset-b7235ae7.css\'')).toBeTruthy();
//   });
// });
