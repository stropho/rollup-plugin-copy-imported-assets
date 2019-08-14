import { removeEmptyImport } from '../utils';

describe('utils', () => {
  describe('removeEmptyImport - no change', () => {
    const dataProvider = [
      // [code, importPath]
      [
        'import "foo"',
        'bar',
      ],
      [
        'import \'foo\'',
        'bar',
      ],
      [
        'import "foo";',
        'bar',
      ],
      [
        'import "Xbar"',
        'bar',
      ],
    ];
    test.each(dataProvider)(
      '%#. - no change by removeEmptyImport(code, importPath)',
      (code, importPath) => {
        const expectedResult = code;
        const actualResult = removeEmptyImport(code, importPath);
        expect(actualResult).toEqual(expectedResult);
      },
    );
  });
  describe('removeEmptyImport - removes single import', () => {
    const dataProvider = [
      // [code, importPath]
      [
        'import "foo"',
        'foo',
      ],
      [
        'import \'foo\'',
        'foo',
      ],
      [
        'import "foo";',
        'foo',
      ],
      [
        'import "foo"\n',
        'foo',
      ],
      [
        'import     "foo";   \n',
        'foo',
      ],
    ];

    const expectedResult = '';

    test.each(dataProvider)(
      '%#. - removeEmptyImport(code, importPath) - matches import and removes it',
      (code, importPath) => {
        const actualResult = removeEmptyImport(code, importPath);
        expect(actualResult).toEqual(expectedResult);
      },
    );
  });
  describe('removeEmptyImport - remove part of code', () => {
    const dataProvider = [
      // [code, importPath, expectedResultCode]
      [
        `
        import "foo"
        import "bar"
        import "foo"
        `,
        'foo',
        `
        import "bar"
        `,
      ],
      [
        `
        import "bar"
        import "foo";
        import 'foo'
        `,
        'foo',
        `
        import "bar"
        `,
      ],
    ];
    test.each(dataProvider)(
      '%#. - removeEmptyImport(code, importPath) - matches imports and removes a part of the code',
      (code, importPath, expectedResult) => {
        const actualResult = removeEmptyImport(code, importPath);
        expect(actualResult).toEqual(expectedResult);
      },
    );
  });
});
