
import { createFilter } from 'rollup-pluginutils';
import { readFileSync } from 'fs';
import {
  basename,
  dirname,
  normalize,
  relative,
  resolve,
} from 'path';

import { removeEmptyImport } from './utils';

// using `\0` to keep the virtual module accessible only in this plugin
const VIRTUAL_MODULE = '\0copy-imported-assets-virtual-placeholder';

export default function copyImportedAssets(options = {}) {
  const isIgnoringAll = !options.include && !options.exclude;

  const state = {
    keepEmptyImports: options.keepEmptyImports || false,
    filter: isIgnoringAll ? () => false : createFilter(options.include, options.exclude),
    isIgnoringAll,
    transformAsset: /* options.transformAsset || */ readFileSync,
    absPathToAssetId: {},
  };

  return {
    name: 'copy-imported-assets', // this name will show up in warnings and errors
    outputOptions(outputOptions) {
      if (state.isIgnoringAll) {
        this.warn('No options to include files were specified - ignoring all');
      }

      if (outputOptions.format !== 'es') {
        this.warn('Only format \'esm\' is supported, '
          + 'others should NOT be used with this plugin');
      }
    },
    resolveId(id, importer) {
      // we're not interested in entry files
      if (!importer) return null;
      if (!state.filter(id)) return null;

      const importerDir = dirname(importer);
      const assetAbsPath = resolve(importerDir, id);
      // in case the asset content changes, we won't know :(
      // but that's ok because there not a reasonable use-case
      // why this plugin should run in watch mode
      const isEmitted = Object.prototype.hasOwnProperty.call(state.absPathToAssetId, assetAbsPath);
      if (!isEmitted) {
        // copy the asset
        const fileName = basename(id);
        const assetId = this.emitFile({
          type: 'asset',
          source: state.transformAsset(assetAbsPath),
          name: fileName,
        });
        state.absPathToAssetId[assetAbsPath] = assetId;
      }
      const assetId = state.absPathToAssetId[assetAbsPath];
      // temporarily, keep it as an external virtual module
      return {
        id: `${VIRTUAL_MODULE}/${assetId}`,
        external: true,
      };
    },
    renderChunk(code, chunkInfo) {
      const chunkPath = dirname(chunkInfo.fileName);
      const importsToReplace = chunkInfo.imports.filter((i) => i.startsWith(VIRTUAL_MODULE));

      if (!importsToReplace.length) return null;
      return importsToReplace.reduce((codeResult, importPath) => {
        const assetId = importPath.replace(`${VIRTUAL_MODULE}/`, '');
        const assetName = this.getFileName(assetId);

        let reducedCode = codeResult;
        if (!state.keepEmptyImports) {
          reducedCode = removeEmptyImport(reducedCode, importPath);
        }
        reducedCode = reducedCode.replace(importPath, `./${normalize(relative(chunkPath, assetName))}`);

        return reducedCode;
      }, code);
    },
  };
}
