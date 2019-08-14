/* eslint-disable import/prefer-default-export */


export const removeEmptyImport = (code, importPath) => {
  // regexp for import with trailing spaces, but only 1 \n
  const re = new RegExp(`[^\\S\n]*import\\s*(["'])${importPath}\\1;?[^\\S\n]*\n?`, 'g');
  return code.replace(re, '');
};
