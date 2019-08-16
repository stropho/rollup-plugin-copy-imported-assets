
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
const OUTPUT_OPTIONS_TO_DIR = {
  dir: './output',
  format: 'esm',
  // no hash to easily test the file names
  // in another folder to, test relative paths
  chunkFileNames: 'chunks/[name].js',
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

    expect(output[1].isAsset).toBeTruthy();
    const assetFileName = output[1].fileName;

    expect(/\/asset-\w+.myext/.test(assetFileName)).toBeTruthy();
    expect(output[1].fileName).toMatchSnapshot();

    expect(output[0].imports.length).toBe(1);
    expect(output[0].code.includes(`from './${assetFileName}'`)).toBeTruthy();
  });
});

describe('importing-parent-asset', () => {
  it('generates esm output with external asset that has relative path', async () => {
    const inputOptions = {
      input: 'src/_tests_/fixture/importing-parent-asset/index.js',
      plugins: [
        copyImportedAssets({ include: /\.myext/ }),
        babel(BABEL_OPTIONS),
      ],
    };

    const bundle = await rollup(inputOptions);
    const { output } = await bundle.generate(OUTPUT_OPTIONS);

    expect(output.length).toBe(2);

    expect(output[1].isAsset).toBeTruthy();
    const assetFileName = output[1].fileName;

    expect(/\/asset-\w+.myext/.test(assetFileName)).toBeTruthy();
    expect(output[1].fileName).toMatchSnapshot();

    expect(output[0].imports.length).toBe(1);
    expect(output[0].code.includes(`from './${assetFileName}'`)).toBeTruthy();
  });
});

describe('importing-same-asset', () => {
  it('generates esm output with single external asset imported multiple times', async () => {
    const inputOptions = {
      input: 'src/_tests_/fixture/importing-same-asset/index.js',
      plugins: [
        copyImportedAssets({ include: /\.myext/ }),
        babel(BABEL_OPTIONS),
      ],
    };

    const bundle = await rollup(inputOptions);
    const { output } = await bundle.generate(OUTPUT_OPTIONS);

    expect(output.length).toBe(2);

    expect(output[1].isAsset).toBeTruthy();
    const assetFileName = output[1].fileName;

    expect(/\/asset-\w+.myext/.test(assetFileName)).toBeTruthy();
    expect(output[1].fileName).toMatchSnapshot();

    expect(output[0].imports.length).toBe(1);
    expect(output[0].code.includes(`from './${assetFileName}'`)).toBeTruthy();
  });
});

describe('importing-asset-to-a-shared-chunk', () => {
  it('generates 4 files importing asset only once', async () => {
    const inputOptions = {
      input: {
        entry1: 'src/_tests_/fixture/importing-asset-to-multiple-chunks/entry1.js',
        entry2: 'src/_tests_/fixture/importing-asset-to-multiple-chunks/entry2.js',
      },
      plugins: [
        copyImportedAssets({ include: /\.myext/ }),
        babel(BABEL_OPTIONS),
      ],
    };
    const assetFileNameRe = /^assets\/asset-\w+.myext$/;

    const bundle = await rollup(inputOptions);
    const { output } = await bundle.generate(OUTPUT_OPTIONS_TO_DIR);

    expect(output.length).toBe(4);
    const fileNames = output.map((f) => f.fileName);

    // examine asset
    expect(fileNames).toContainEqual(expect.stringMatching(assetFileNameRe));
    const assetFileIndex = fileNames.findIndex((name) => assetFileNameRe.test(name));
    const asset = output[assetFileIndex];
    expect(asset.isAsset).toBeTruthy();
    expect(asset.fileName).toMatchSnapshot();

    // examine asset-import
    expect(fileNames).toContain('chunks/asset-import.js');
    const assetImportFileIndex = fileNames.findIndex((name) => name === 'chunks/asset-import.js');
    const assetImport = output[assetImportFileIndex];
    expect(assetImport.imports).toHaveLength(1);
    expect(assetImport.code).toContain(`'./../${asset.fileName}`);
    // examine entry1
    expect(fileNames).toContain('entry1.js');
    const entry1FileIndex = fileNames.findIndex((name) => name === 'entry1.js');
    const entry1 = output[entry1FileIndex];
    expect(entry1.code).toContain(assetImport.fileName);
    expect(entry1.code).not.toContain(asset.fileName);
    // examine entry2
    expect(fileNames).toContain('entry2.js');
    const entry2FileIndex = fileNames.findIndex((name) => name === 'entry2.js');
    const entry2 = output[entry2FileIndex];
    expect(entry2.code).toContain(assetImport.fileName);
    expect(entry1.code).not.toContain(asset.fileName);
  });
  it('generates 4 files, importing asset also in entry points', async () => {
    const inputOptions = {
      input: {
        entry1: 'src/_tests_/fixture/importing-asset-to-multiple-chunks/entry1.js',
        entry2: 'src/_tests_/fixture/importing-asset-to-multiple-chunks/entry2.js',
      },
      plugins: [
        copyImportedAssets({ include: /\.myext/, keepEmptyImports: true }),
        babel(BABEL_OPTIONS),
      ],
    };
    const assetFileNameRe = /^assets\/asset-\w+.myext$/;

    const bundle = await rollup(inputOptions);
    const { output } = await bundle.generate(OUTPUT_OPTIONS_TO_DIR);

    expect(output.length).toBe(4);
    const fileNames = output.map((f) => f.fileName);

    // examine asset
    expect(fileNames).toContainEqual(expect.stringMatching(assetFileNameRe));
    const assetFileIndex = fileNames.findIndex((name) => assetFileNameRe.test(name));
    const asset = output[assetFileIndex];
    expect(asset.isAsset).toBeTruthy();
    expect(asset.fileName).toMatchSnapshot();

    // examine asset-import
    expect(fileNames).toContain('chunks/asset-import.js');
    const assetImportFileIndex = fileNames.findIndex((name) => name === 'chunks/asset-import.js');
    const assetImport = output[assetImportFileIndex];
    expect(assetImport.imports).toHaveLength(1);
    expect(assetImport.code).toContain(`'./../${asset.fileName}`);
    // examine entry1
    expect(fileNames).toContain('entry1.js');
    const entry1FileIndex = fileNames.findIndex((name) => name === 'entry1.js');
    const entry1 = output[entry1FileIndex];
    expect(entry1.code).toContain(assetImport.fileName);
    expect(entry1.code).toContain(asset.fileName);
    // examine entry2
    expect(fileNames).toContain('entry2.js');
    const entry2FileIndex = fileNames.findIndex((name) => name === 'entry2.js');
    const entry2 = output[entry2FileIndex];
    expect(entry2.code).toContain(assetImport.fileName);
    expect(entry1.code).toContain(asset.fileName);
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
