import { createFilter } from 'rollup-pluginutils';
import { readFileSync } from 'fs';
import { dirname, resolve, basename, normalize } from 'path';

const VIRTUAL_MODULE = '\0copy-imported-assets-virtual-placeholder';
function copyImportedAssets(options = {}) {
  const isIgnoringAll = !options.include && !options.exclude;
  const state = {
    filter: isIgnoringAll ? () => false : createFilter(options.include, options.exclude),
    isIgnoringAll,
    transformAsset:
    /* options.transformAsset || */
    readFileSync,
    absPathToAssetId: {}
  };
  return {
    name: 'copy-imported-assets',

    // this name will show up in warnings and errors
    outputOptions(outputOptions) {
      if (state.isIgnoringAll) {
        this.warn('No options to include files were specified - ignoring all');
      }

      if (outputOptions.format !== 'es') {
        this.warn('Only format \'esm\' is supported, ' + 'others should NOT be used with this plugin');
      }
    },

    resolveId(id, importer) {
      // we're not interested in entry files
      if (!importer) return null;
      if (!state.filter(id)) return null;
      const importerDir = dirname(importer);
      const assetAbsPath = resolve(importerDir, id); // in case the asset content changes, we won't know :(

      const isAssetEmited = Object.prototype.hasOwnProperty.call(state.absPathToAssetId, assetAbsPath);

      if (!isAssetEmited) {
        // copy the asset
        const fileName = basename(id);
        const assetId = this.emitAsset(fileName, state.transformAsset(assetAbsPath));
        state.absPathToAssetId[assetAbsPath] = assetId;
      }

      const assetId = state.absPathToAssetId[assetAbsPath]; // temporarily, keep it as an external virtual module

      return {
        id: `${VIRTUAL_MODULE}/${assetId}`,
        external: true
      };
    },

    renderChunk(code, chunkInfo) {
      const importsToReplace = chunkInfo.imports.filter(i => i.startsWith(VIRTUAL_MODULE));
      if (!importsToReplace.length) return null;
      return importsToReplace.reduce((codeResult, i) => {
        const assetId = i.replace(`${VIRTUAL_MODULE}/`, '');
        const assetName = this.getAssetFileName(assetId);
        return codeResult.replace(i, `./${normalize(assetName)}`);
      }, code);
    }

  };
}

export default copyImportedAssets;